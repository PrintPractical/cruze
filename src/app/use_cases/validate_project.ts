import { hasErrors, validateProject } from "../../domain/validation/validate_project.ts";
import type { Problem } from "../../domain/validation/problem.ts";
import { loadView } from "../project_context.ts";
import type { ProjectFiles } from "../ports/project_files.ts";

export interface ValidateReport {
  valid: boolean;
  errors: number;
  warnings: number;
  problems: Problem[];
}

/** Checks every document in the project against the cruze-formats rules. */
export async function validate(deps: { files: ProjectFiles }): Promise<ValidateReport> {
  const problems = validateProject(await loadView(deps.files));
  return {
    valid: !hasErrors(problems),
    errors: problems.filter((p) => p.severity === "error").length,
    warnings: problems.filter((p) => p.severity === "warning").length,
    problems,
  };
}
