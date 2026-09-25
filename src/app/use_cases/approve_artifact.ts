import { evaluateApproval } from "../../domain/approvals/evaluate.ts";
import { fingerprint, isApprovable } from "../../domain/approvals/fingerprint.ts";
import { serializeApprovals, withApproval } from "../../domain/approvals/records.ts";
import { CruzeError } from "../../domain/cruze_error.ts";
import { updateProgress } from "../../domain/edits/progress_block.ts";
import { stampMissingStatuses } from "../../domain/edits/status_lines.ts";
import { parseMarkdown } from "../../domain/markdown.ts";
import { resolveArtifact } from "../../domain/project/artifact_ref.ts";
import { PATHS } from "../../domain/project/layout.ts";
import { isPlanned, readChangesTable } from "../../domain/project/plan_parts.ts";
import { readProgress } from "../../domain/project/progress.ts";
import { approvalFolder, approvalsPath, type ProjectView } from "../../domain/project/project_view.ts";
import { featureOf } from "../../domain/project/work_items.ts";
import { validateProject } from "../../domain/validation/validate_project.ts";
import { appendJournal, loadView, withFiles, type ProjectDeps } from "../project_context.ts";

export interface ApproveReport {
  artifact: string;
  hash: string;
  upstream: string[];
  /** Elements that received a `planned` status. */
  stamped: string[];
  /** The branch a change was bound to, when this approval bound it. */
  bound?: string;
}

/**
 * Records a person's approval of a document: its design hash and the hashes of everything
 * upstream it relies on. Refuses invalid documents and documents whose upstream isn't approved.
 */
export async function approveArtifact(deps: ProjectDeps, ref: string): Promise<ApproveReport> {
  let view = await loadView(deps.files);
  const { path, item } = resolveArtifact(view, ref);
  if (!isApprovable(view, path)) throw new CruzeError("not-approvable", `${path} is not something you approve; it changes through approved work`);
  requireUpstreamApproved(view, path);
  if (item?.kind === "feature" && readChangesTable(item.doc).length === 0) {
    throw new CruzeError("not-designed", `${path} has no changes yet; architect designs and splits it before approval`);
  }
  if (item !== undefined && item.kind !== "feature" && !isPlanned(item.doc)) {
    throw new CruzeError("not-planned", `${path} has no test plan or tasks yet; plan it before approving`);
  }

  const edits = new Map<string, string>();
  let text = view.snapshot.get(path) ?? "";
  let stamped: string[] = [];
  if (path === PATHS.architecture) ({ text, stamped } = stampMissingStatuses(text));
  let bound: string | undefined;
  if (item !== undefined && item.kind !== "feature" && readProgress(parseMarkdown(text)).branch === undefined) {
    bound = (await deps.repository.currentBranch()) ?? undefined;
    text = updateProgress(text, (progress) => {
      if (bound !== undefined) progress.branch = bound;
    });
  }
  if (text !== view.snapshot.get(path)) edits.set(path, text);
  view = withFiles(view, edits);

  const errors = validateProject(view).filter((p) => p.path === path && p.severity === "error");
  if (errors.length > 0) {
    const listing = errors.map((p) => `  ${p.path}:${p.line ?? ""} ${p.message}`).join("\n");
    throw new CruzeError("invalid", `${path} has ${errors.length} problem(s) to fix before approval:\n${listing}`);
  }

  const { hash, upstream } = fingerprint(view, path, parseMarkdown(text));
  const folder = approvalFolder(view, path);
  const approvals = withApproval(view.approvals.get(folder) ?? { version: 1, approvals: [], merged: {} }, {
    artifact: path,
    hash,
    upstream,
    approvedAt: deps.clock.now().toISOString(),
    by: (await deps.repository.userName()) ?? "unknown",
  });
  for (const [changed, content] of edits) await deps.files.writeText(changed, content);
  await deps.files.writeText(approvalsPath(folder), serializeApprovals(approvals));
  await appendJournal(deps, folder, "approve", { artifact: path, hash });
  const report: ApproveReport = { artifact: path, hash, upstream: Object.keys(upstream), stamped };
  if (bound !== undefined) report.bound = bound;
  return report;
}

/** A change needs its feature approved; a feature or standalone change needs the architecture approved. */
function requireUpstreamApproved(view: ProjectView, path: string): void {
  const item = view.items.find((i) => i.path === path);
  if (item === undefined) return;
  const upstream = item.kind === "change" ? featureOf(view.items, item)?.path : view.snapshot.has(PATHS.architecture) ? PATHS.architecture : undefined;
  if (upstream === undefined) return;
  const status = evaluateApproval(view, upstream);
  if (status.state !== "approved") {
    throw new CruzeError("upstream-not-approved", `approve ${upstream} first; it is ${status.state}${status.changed.length > 0 ? ` (${status.changed.join(", ")})` : ""}`);
  }
}
