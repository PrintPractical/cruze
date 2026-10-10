import { requirePlanReviewClosed, requireUnchangedSinceApproval, type AgentBasis } from "../../domain/approvals/agent_approval.ts";
import { evaluateApproval } from "../../domain/approvals/evaluate.ts";
import { fingerprint, isApprovable } from "../../domain/approvals/fingerprint.ts";
import { latestApproval, serializeApprovals, withApproval, type ApprovalRecord } from "../../domain/approvals/records.ts";
import { CruzeError } from "../../domain/cruze_error.ts";
import { updateProgress } from "../../domain/edits/progress_block.ts";
import { setStatus, stampMissingStatuses } from "../../domain/edits/status_lines.ts";
import { statusOf } from "../../domain/elements.ts";
import { elementHash } from "../../domain/hashing.ts";
import { parseMarkdown } from "../../domain/markdown.ts";
import { resolveArtifact } from "../../domain/project/artifact_ref.ts";
import { readDelta } from "../../domain/project/deltas.ts";
import { PATHS } from "../../domain/project/layout.ts";
import { isPlanned, readChangesTable } from "../../domain/project/plan_parts.ts";
import { readProgress } from "../../domain/project/progress.ts";
import { approvalFolder, approvalsPath, type ProjectView } from "../../domain/project/project_view.ts";
import { featureOf } from "../../domain/project/work_items.ts";
import type { Problem } from "../../domain/validation/problem.ts";
import { SIZE_RULES } from "../../domain/validation/size_rules.ts";
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
  /** Built elements this approval set back to planned, because a rethink changed them. */
  replanned: string[];
  /** Elements whose current living text this feature accepted after a land conflict. */
  rebased: string[];
  /** Why the agent gave this approval for the user, when it did. */
  basis?: AgentBasis;
  /** For a re-stamp: the upstream IDs or documents that had changed. */
  restamped?: string[];
}

export interface ApproveOptions {
  /** Architecture elements to set back to `planned`: their design changed and their code must follow. */
  replan?: string[];
  /** Elements this work's delta changes whose living text changed since its last approval; the approval accepts the current text. */
  rebase?: string[];
  /** Approve for the user: a change whose plan review closed, or work a rethink left unchanged. */
  agent?: AgentBasis;
}

/**
 * Records a person's approval of a document: its design hash and the hashes of everything
 * upstream it relies on. Refuses invalid documents and documents whose upstream isn't approved.
 */
export async function approveArtifact(deps: ProjectDeps, ref: string, options: ApproveOptions = {}): Promise<ApproveReport> {
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
  const before = evaluateApproval(view, path);
  if (options.agent === "plan-review") requirePlanReviewClosed(view.journal, item ?? notWork(path));
  if (options.agent === "rethink") requireUnchangedSinceApproval(view.journal, item, path, before);

  const edits = new Map<string, string>();
  let text = view.snapshot.get(path) ?? "";
  let stamped: string[] = [];
  if (path === PATHS.architecture) ({ text, stamped } = stampMissingStatuses(text));
  const replanned = options.replan ?? [];
  if (replanned.length > 0 && path !== PATHS.architecture) throw new CruzeError("replan-architecture-only", "--replan applies to the architecture");
  for (const id of replanned) {
    const element = view.living.elements.get(id);
    if (element?.path !== PATHS.architecture || statusOf(element.doc, element.element) !== "built") {
      throw new CruzeError("not-built", `${id} is not a built element of ${PATHS.architecture}`);
    }
    text = setStatus(text, id, "planned");
  }
  let bound: string | undefined;
  if (item !== undefined && item.kind !== "feature" && readProgress(parseMarkdown(text)).branch === undefined) {
    bound = (await deps.repository.currentBranch()) ?? undefined;
    text = updateProgress(text, (progress) => {
      if (bound !== undefined) progress.branch = bound;
    });
  }
  if (text !== view.snapshot.get(path)) edits.set(path, text);
  view = withFiles(view, edits);

  const problems = validateProject(view).filter((p) => p.path === path);
  const errors = problems.filter((p) => p.severity === "error");
  if (errors.length > 0) {
    const listing = errors.map((p) => `  ${p.path}:${p.line ?? ""} ${p.message}`).join("\n");
    throw new CruzeError("invalid", `${path} has ${errors.length} problem(s) to fix before approval:\n${listing}`);
  }
  requireSizesAccepted(problems, path);

  const { hash, upstream } = fingerprint(view, path, parseMarkdown(text));
  const folder = approvalFolder(view, path);
  const current = view.approvals.get(folder) ?? { version: 1, approvals: [], merged: {} };
  const rebased = options.rebase ?? [];
  const deltaIds = item === undefined || item.kind === "change" ? new Set<string>() : readDelta(item.doc).ids;
  requireRebased(view, deltaIds, latestApproval(current, path), rebased);
  const merged = { ...current.merged };
  for (const id of rebased) {
    const living = view.living.elements.get(id);
    if (living === undefined || (merged[id] === undefined && !deltaIds.has(id))) {
      throw new CruzeError("not-in-delta", `${id} is not a living element that ${item?.ref ?? path} changes or merged`);
    }
    if (merged[id] !== undefined) merged[id] = elementHash(living.doc, living.element);
  }
  const approvals = withApproval({ ...current, merged }, {
    artifact: path,
    hash,
    upstream,
    approvedAt: deps.clock.now().toISOString(),
    by: (await deps.repository.userName()) ?? "unknown",
    ...(options.agent === undefined ? {} : { basis: options.agent }),
  });
  for (const [changed, content] of edits) await deps.files.writeText(changed, content);
  await deps.files.writeText(approvalsPath(folder), serializeApprovals(approvals));
  const restamped = options.agent === "rethink" ? before.changed : undefined;
  await appendJournal(deps, folder, "approve", {
    artifact: path,
    hash,
    ...(replanned.length > 0 ? { replanned } : {}),
    ...(rebased.length > 0 ? { rebased } : {}),
    ...(options.agent === undefined ? {} : { basis: options.agent }),
    ...(restamped === undefined ? {} : { restamped }),
  });
  const report: ApproveReport = { artifact: path, hash, upstream: Object.keys(upstream), stamped, replanned, rebased };
  if (bound !== undefined) report.bound = bound;
  if (options.agent !== undefined) report.basis = options.agent;
  if (restamped !== undefined) report.restamped = restamped;
  return report;
}

/**
 * A feature or standalone change whose delta changes an element must have been written against
 * that element's current text. When the living element changed since the last approval, through
 * a rethink or another land, the delta would overwrite that edit, so approval waits until the
 * delta is reconciled and the element is named with --rebase.
 */
function requireRebased(view: ProjectView, deltaIds: Set<string>, previous: ApprovalRecord | undefined, rebased: string[]): void {
  if (previous === undefined) return;
  const moved = [...deltaIds].filter((id) => {
    const living = view.living.elements.get(id);
    const before = previous.upstream[id];
    return living !== undefined && before !== undefined && before !== elementHash(living.doc, living.element) && !rebased.includes(id);
  });
  if (moved.length > 0) {
    throw new CruzeError(
      "rebase-required",
      `the living text of ${moved.join(", ")} changed since the last approval, and this work's delta changes ${moved.length === 1 ? "it" : "them"}. Rewrite the delta to keep that change, then approve with ${moved.map((id) => `--rebase ${id}`).join(" ")}`,
    );
  }
}

/**
 * A size warning stands until the work is split or the user accepts it under `changes.exceptions`.
 * A 28-task change approved over its warning went on to 26 deviations, so approval waits for one or the other.
 */
function requireSizesAccepted(problems: Problem[], path: string): void {
  const standing = problems.filter((p) => SIZE_RULES.includes(p.rule));
  if (standing.length === 0) return;
  const listing = standing.map((p) => `  ${p.message} [${p.rule}]`).join("\n");
  throw new CruzeError(
    "size-unaccepted",
    `${path} has ${standing.length} size warning(s). Split the work through rethink, or record the user's acceptance under changes.exceptions in .cruze/config.yaml, as the item's ref and their reason:\n${listing}`,
  );
}

function notWork(path: string): never {
  throw new CruzeError("needs-user", `${path} is a project document, so the user approves it`);
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
