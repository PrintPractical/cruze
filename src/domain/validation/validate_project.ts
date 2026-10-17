import { PATHS } from "../project/layout.ts";
import type { ProjectDocs } from "../project/project_docs.ts";
import { documentProblems } from "./document_rules.ts";
import { error, sortProblems, type Problem } from "./problem.ts";
import { releaseProblems } from "./release_rules.ts";

/** Every rule in the cruze-formats skill, applied to the whole project. */
export function validateProject(docs: ProjectDocs): Problem[] {
  const config = docs.config === undefined
    ? [error(PATHS.config, undefined, "config", "the project has no config; run cruze init")]
    : docs.config.problems.map((message) => error(PATHS.config, undefined, "config", message));
  const approvals = approvalsFileProblems(docs.snapshot.get(PATHS.approvals));
  return sortProblems([...config, ...approvals, ...documentProblems(docs), ...releaseProblems(docs)]);
}

export function hasErrors(problems: Problem[]): boolean {
  return problems.some((problem) => problem.severity === "error");
}

function approvalsFileProblems(text: string | undefined): Problem[] {
  if (text === undefined) return [];
  try {
    const parsed: unknown = JSON.parse(text);
    if (!Array.isArray((parsed as { approvals?: unknown }).approvals)) return [error(PATHS.approvals, undefined, "approvals-file", "needs an approvals list; only cruze approve writes this file")];
    return [];
  } catch {
    return [error(PATHS.approvals, undefined, "approvals-file", "not valid JSON; only cruze approve writes this file")];
  }
}
