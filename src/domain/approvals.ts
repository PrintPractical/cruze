import { designHash } from "./hashing.ts";
import type { MarkdownDoc } from "./markdown.ts";

/** One approval of one document: the hash of its design content when the user approved it. */
export interface ApprovalRecord {
  path: string;
  hash: string;
  approvedAt: string;
  by: string;
}

export type ApprovalState = "approved" | "edited" | "unapproved";

/** Reads `.cruze/approvals.json`; anything unreadable counts as no approvals, and validate reports it. */
export function parseApprovals(text: string | undefined): ApprovalRecord[] {
  if (text === undefined) return [];
  try {
    const parsed: unknown = JSON.parse(text);
    const list = (parsed as { approvals?: unknown }).approvals;
    if (!Array.isArray(list)) return [];
    return list.filter((r): r is ApprovalRecord => typeof r?.path === "string" && typeof r?.hash === "string" && typeof r?.approvedAt === "string" && typeof r?.by === "string");
  } catch {
    return [];
  }
}

export function serializeApprovals(records: ApprovalRecord[]): string {
  const sorted = [...records].sort((a, b) => a.path.localeCompare(b.path));
  return `${JSON.stringify({ version: 2, approvals: sorted }, null, 2)}\n`;
}

/** The records with this one replacing any earlier approval of the same document. */
export function withApproval(records: ApprovalRecord[], record: ApprovalRecord): ApprovalRecord[] {
  return [...records.filter((r) => r.path !== record.path), record];
}

/** Whether the document still reads as it did when it was approved. */
export function approvalState(records: readonly ApprovalRecord[], path: string, doc: MarkdownDoc): ApprovalState {
  const record = records.find((r) => r.path === path);
  if (record === undefined) return "unapproved";
  return record.hash === designHash(doc) ? "approved" : "edited";
}
