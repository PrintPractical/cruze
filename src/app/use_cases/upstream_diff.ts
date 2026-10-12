import { evaluateApproval, type ApprovalState } from "../../domain/approvals/evaluate.ts";
import { rebaseNeeded } from "../../domain/approvals/rebase.ts";
import { upstreamLines, upstreamPath } from "../../domain/approvals/upstream_text.ts";
import { lineDiff } from "../../domain/line_diff.ts";
import { resolveArtifact } from "../../domain/project/artifact_ref.ts";
import { approvalFolder, approvalsPath } from "../../domain/project/project_view.ts";
import { loadView, type ProjectDeps } from "../project_context.ts";

export interface UpstreamChange {
  /** The upstream element ID, or `doc:<path>` for a feature's design. */
  key: string;
  path?: string;
  /** The approved text against the current text, when the approved text was found. */
  diff?: string[];
  note?: string;
}

export interface UpstreamDiffReport {
  artifact: string;
  ref?: string;
  state: ApprovalState;
  changes: UpstreamChange[];
  /** Elements the work's delta changes whose living text moved: approval needs --rebase for each. */
  rebase: string[];
}

/**
 * What changed upstream of a document since its approval, element by element, so a person can
 * judge a re-stamp from the text rather than the IDs. The approved text comes from the commit
 * that recorded the approval. One project went to a rethink for two file-list merges that
 * changed no behaviour, because status named only the IDs.
 */
export async function upstreamDiff(deps: ProjectDeps, ref: string): Promise<UpstreamDiffReport> {
  const view = await loadView(deps.files);
  const { path, item } = resolveArtifact(view, ref);
  const status = evaluateApproval(view, path);
  const report: UpstreamDiffReport = { artifact: path, state: status.state, changes: [], rebase: item === undefined ? [] : rebaseNeeded(view, item) };
  if (item !== undefined) report.ref = item.ref;
  const record = status.record;
  if (record === undefined || status.changed.length === 0) return report;
  const commit = await deps.repository.firstCommitAdding(approvalsPath(approvalFolder(view, path)), record.approvedAt);
  for (const key of status.changed) {
    const where = upstreamPath(view, key);
    if (where === undefined) {
      report.changes.push({ key, note: "it no longer exists" });
      continue;
    }
    const now = upstreamLines(key, where, view.snapshot.get(where) ?? "") ?? [];
    const then = commit === null ? null : await deps.repository.fileAt(commit, where);
    const approved = then === null ? undefined : upstreamLines(key, where, then, record.upstream[key]);
    if (approved !== undefined) report.changes.push({ key, path: where, diff: lineDiff(approved, now) });
    else report.changes.push({ key, path: where, note: commit === null ? "the approval isn't committed yet; compare with git diff" : `its approved text isn't in ${where} at ${commit}, the commit that recorded the approval` });
  }
  return report;
}
