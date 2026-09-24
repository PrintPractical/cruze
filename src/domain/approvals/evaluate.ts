import { parseMarkdown } from "../markdown.ts";
import { approvalFolder, type ProjectView } from "../project/project_view.ts";
import { currentUpstreamHash, fingerprint } from "./fingerprint.ts";
import { latestApproval, type ApprovalRecord } from "./records.ts";

export type ApprovalState = "approved" | "edited" | "upstream-changed" | "unapproved";

export interface ApprovalStatus {
  artifact: string;
  state: ApprovalState;
  /** Upstream IDs or documents that changed or disappeared since approval. */
  changed: string[];
  record?: ApprovalRecord;
  /** Set when an approval exists but the journal has no matching entry. */
  unjournaled?: boolean;
}

/**
 * Computes an artifact's approval state from content, never from stored state:
 * editing an upstream document is all it takes to make downstream work stale.
 */
export function evaluateApproval(view: ProjectView, artifact: string): ApprovalStatus {
  const record = latestApproval(view.approvals.get(approvalFolder(view, artifact)) ?? { version: 1, approvals: [], merged: {} }, artifact);
  if (record === undefined) return { artifact, state: "unapproved", changed: [] };
  const journaled = view.journal.some((e) => e.event === "approve" && e.artifact === artifact && e.hash === record.hash);
  if (!journaled) return { artifact, state: "unapproved", changed: [], record, unjournaled: true };

  const text = view.snapshot.get(artifact);
  if (text === undefined) return { artifact, state: "unapproved", changed: [], record };
  const { hash } = fingerprint(view, artifact, parseMarkdown(text));
  if (hash !== record.hash) return { artifact, state: "edited", changed: [], record };
  const changed = Object.entries(record.upstream)
    .filter(([key, pinned]) => currentUpstreamHash(view, key) !== pinned)
    .map(([key]) => key);
  return { artifact, state: changed.length > 0 ? "upstream-changed" : "approved", changed, record };
}
