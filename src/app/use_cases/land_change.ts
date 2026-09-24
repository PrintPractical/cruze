import { evaluateApproval } from "../../domain/approvals/evaluate.ts";
import { fingerprint } from "../../domain/approvals/fingerprint.ts";
import { serializeApprovals, withApproval, type ApprovalsFile } from "../../domain/approvals/records.ts";
import { CruzeError } from "../../domain/cruze_error.ts";
import { applyBookkeeping } from "../../domain/land/bookkeeping.ts";
import { planMerge } from "../../domain/land/merge_plan.ts";
import { parseMarkdown } from "../../domain/markdown.ts";
import { resolveChange } from "../../domain/project/artifact_ref.ts";
import { PATHS } from "../../domain/project/layout.ts";
import { isoDate } from "../../domain/project/new_items.ts";
import { readTasks } from "../../domain/project/plan_parts.ts";
import { readProgress } from "../../domain/project/progress.ts";
import { approvalFolder, approvalsPath, type ProjectView } from "../../domain/project/project_view.ts";
import { changesOf, featureOf, type WorkItem } from "../../domain/project/work_items.ts";
import { activeChange } from "../../domain/status/work_status.ts";
import { validateProject } from "../../domain/validation/validate_project.ts";
import { appendJournal, loadView, withFiles, type ProjectDeps } from "../project_context.ts";

export interface LandReport {
  change: string;
  merged: string[];
  built: string[];
  removed: string[];
  restamped: string[];
  finished: boolean;
  archivedTo?: string;
}

/**
 * Lands a finished change: merges its work into the living docs, re-stamps the approvals the
 * merge would otherwise make stale, records the land, and archives the work once it is finished.
 * Nothing is written unless the merged docs still validate.
 */
export async function landChange(deps: ProjectDeps, ref?: string): Promise<LandReport> {
  const view = await loadView(deps.files);
  const change = ref !== undefined ? resolveChange(view, ref) : activeChange(view, await deps.repository.currentBranch());
  if (change === undefined) throw new CruzeError("no-active-change", "no change is bound to this branch; name one to land");
  const source = change.kind === "change" ? featureOf(view.items, change) : change;
  if (source === undefined) throw new CruzeError("orphan-change", `${change.ref} has no feature.md`);
  requireReady(view, change, source);

  const restamp = [PATHS.architecture, source.path, ...(source === change ? [] : changesOf(view.items, source).map((c) => c.path))]
    .filter((path, i, all) => all.indexOf(path) === i && view.snapshot.has(path) && evaluateApproval(view, path).state === "approved");

  const plan = planMerge(view, change, source);
  const commit = await deps.repository.headCommit();
  const landed = `${isoDate(deps.clock.now())}${commit === null ? "" : ` (${commit})`}`;
  const books = applyBookkeeping(view, change, source, landed, plan.files);
  const merged = withFiles(view, plan.files);
  requireStillValid(view, merged);

  const approvals = new Map<string, ApprovalsFile>();
  const by = (await deps.repository.userName()) ?? "unknown";
  for (const path of restamp) {
    const folder = approvalFolder(merged, path);
    const { hash, upstream } = fingerprint(merged, path, parseMarkdown(merged.snapshot.get(path) ?? ""));
    const file = approvals.get(folder) ?? merged.approvals.get(folder) ?? { version: 1, approvals: [], merged: {} };
    approvals.set(folder, withApproval(file, { artifact: path, hash, upstream, approvedAt: deps.clock.now().toISOString(), by, basis: `land ${change.ref}` }));
  }
  const sourceApprovals = approvals.get(source.folder) ?? merged.approvals.get(source.folder) ?? { version: 1, approvals: [], merged: {} };
  approvals.set(source.folder, { ...sourceApprovals, merged: plan.merged });

  for (const [path, text] of plan.files) await deps.files.writeText(path, text);
  for (const [folder, file] of approvals) await deps.files.writeText(approvalsPath(folder), serializeApprovals(file));
  for (const path of restamp) {
    const record = approvals.get(approvalFolder(merged, path))?.approvals.find((r) => r.artifact === path);
    await appendJournal(deps, approvalFolder(merged, path), "approve", { artifact: path, hash: record?.hash, basis: `land ${change.ref}` });
  }
  await appendJournal(deps, source.folder, "land", { change: change.ref, merged: plan.mergedIds, built: plan.built, removed: plan.removed, release: books.release, commit });
  if (books.archive !== undefined) await deps.files.move(books.archive.from, books.archive.to);

  const report: LandReport = { change: change.ref, merged: plan.mergedIds, built: plan.built, removed: plan.removed, restamped: restamp, finished: books.finished };
  if (books.archive !== undefined) report.archivedTo = books.archive.to;
  return report;
}

/** The change, its feature and the architecture are approved and current, valid, and every task is done. */
function requireReady(view: ProjectView, change: WorkItem, source: WorkItem): void {
  const reasons: string[] = [];
  for (const path of [change.path, source.path, PATHS.architecture].filter((p, i, all) => all.indexOf(p) === i && view.snapshot.has(p))) {
    const status = evaluateApproval(view, path);
    if (status.state !== "approved") reasons.push(`${path} is ${status.state}${status.changed.length > 0 ? ` (${status.changed.join(", ")})` : ""}`);
  }
  const errors = validateProject(view).filter((p) => p.severity === "error" && (p.path === change.path || p.path === source.path));
  reasons.push(...errors.map((p) => `${p.path}:${p.line ?? ""} ${p.message}`));
  const progress = readProgress(change.doc);
  const open = readTasks(change.doc).tasks.filter((task) => (progress.tasks.get(task.number) ?? null) === null).map((task) => task.number);
  if (open.length > 0) reasons.push(`tasks not done: ${open.join(", ")}`);
  if (reasons.length > 0) throw new CruzeError("not-ready", `${change.ref} cannot land yet:\n  ${reasons.join("\n  ")}`);
}

/** The merge may not introduce errors into the living docs. */
function requireStillValid(before: ProjectView, after: ProjectView): void {
  const key = (p: { path: string; message: string }): string => `${p.path}|${p.message}`;
  const existing = new Set(validateProject(before).map(key));
  const introduced = validateProject(after).filter((p) => p.severity === "error" && p.path.startsWith("docs/") && !existing.has(key(p)));
  if (introduced.length > 0) {
    throw new CruzeError("merge-invalid", `landing would break the living docs; nothing was written:\n  ${introduced.map((p) => `${p.path}:${p.line ?? ""} ${p.message}`).join("\n  ")}`);
  }
}
