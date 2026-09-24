/** What `approvals.json` holds. Only the CLI writes it. */

export interface ApprovalRecord {
  /** Path of the approved document. */
  artifact: string;
  /** Design hash of the document when approved. */
  hash: string;
  /** Hash of each upstream element or document the approval depends on, by ID or `doc:<path>`. */
  upstream: Record<string, string>;
  approvedAt: string;
  by: string;
  /** Why the approval exists when no person gave it, such as a merge by `land`. */
  basis?: string;
}

export interface ApprovalsFile {
  version: 1;
  approvals: ApprovalRecord[];
  /** For a feature or standalone change: hash of each living element it merged, by ID. */
  merged: Record<string, string>;
}

export function emptyApprovals(): ApprovalsFile {
  return { version: 1, approvals: [], merged: {} };
}

export function parseApprovals(text: string | undefined): { file: ApprovalsFile; problem?: string } {
  if (text === undefined) return { file: emptyApprovals() };
  try {
    const raw = JSON.parse(text) as Partial<ApprovalsFile>;
    if (raw.version !== 1 || !Array.isArray(raw.approvals)) return { file: emptyApprovals(), problem: "approvals.json has an unknown format" };
    return { file: { version: 1, approvals: raw.approvals, merged: raw.merged ?? {} } };
  } catch {
    return { file: emptyApprovals(), problem: "approvals.json is not valid JSON" };
  }
}

export function serializeApprovals(file: ApprovalsFile): string {
  return `${JSON.stringify(file, null, 2)}\n`;
}

/** The latest approval of an artifact, if any. */
export function latestApproval(file: ApprovalsFile, artifact: string): ApprovalRecord | undefined {
  return file.approvals.filter((record) => record.artifact === artifact).at(-1);
}

/** Replaces the artifact's approval: one current approval per artifact; history lives in the journal. */
export function withApproval(file: ApprovalsFile, record: ApprovalRecord): ApprovalsFile {
  return { ...file, approvals: [...file.approvals.filter((r) => r.artifact !== record.artifact), record] };
}
