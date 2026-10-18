import { approvalHash, serializeApprovals, withApproval, type ApprovalRecord } from "../../domain/approvals.ts";
import { CruzeError } from "../../domain/cruze_error.ts";
import { parseMarkdown } from "../../domain/markdown.ts";
import { PATHS } from "../../domain/project/layout.ts";
import { resolveDocument } from "../../domain/project/project_docs.ts";
import { validateProject } from "../../domain/validation/validate_project.ts";
import { loadDocs, type ProjectDeps } from "../project_context.ts";

/**
 * Records that the user approved a document as it reads now: the vision, the architecture map or a
 * feature. Any later edit to its design content shows it as edited until it is approved again.
 */
export async function approveDocument(deps: ProjectDeps, ref: string): Promise<ApprovalRecord> {
  const docs = await loadDocs(deps.files);
  const path = resolveDocument(docs, ref);
  if (path === undefined) throw new CruzeError("not-found", `no document matches "${ref}"; name vision, architecture, a feature slug or a path`);
  const errors = validateProject(docs).filter((p) => p.path === path && p.severity === "error");
  if (errors.length > 0) {
    throw new CruzeError("invalid", `${path} has ${errors.length} problem(s) to fix first: ${errors.map((p) => `${p.line === undefined ? "" : `line ${p.line}: `}${p.message}`).join("; ")}`);
  }
  const record: ApprovalRecord = {
    path,
    hash: approvalHash(path, parseMarkdown(docs.snapshot.get(path) ?? "")),
    approvedAt: deps.clock.now().toISOString(),
    by: (await deps.repository.userName()) ?? "unknown",
  };
  await deps.files.writeText(PATHS.approvals, serializeApprovals(withApproval(docs.approvals, record)));
  return record;
}
