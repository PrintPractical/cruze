import { hasErrors, validateProject } from "../../domain/validation/validate_project.ts";
import { warning, type Problem } from "../../domain/validation/problem.ts";
import { PATHS } from "../../domain/project/layout.ts";
import { versionSkew } from "../../domain/versions/cruze_version.ts";
import type { Bundle } from "../ports/bundle.ts";
import { loadView } from "../project_context.ts";
import type { ProjectFiles } from "../ports/project_files.ts";

export interface ValidateReport {
  valid: boolean;
  errors: number;
  warnings: number;
  problems: Problem[];
}

/** Checks every document in the project against the cruze-formats rules, and that its skills match this CLI. */
export async function validate(deps: { files: ProjectFiles; bundle: Bundle }): Promise<ValidateReport> {
  const view = await loadView(deps.files);
  const config = view.config?.config;
  const skew = config === null || config === undefined ? undefined : versionSkew(deps.bundle.version, config.cruze);
  const problems = [...validateProject(view), ...(skew === undefined ? [] : [warning(PATHS.config, undefined, "cruze-version", skew.message)])];
  return {
    valid: !hasErrors(problems),
    errors: problems.filter((p) => p.severity === "error").length,
    warnings: problems.filter((p) => p.severity === "warning").length,
    problems,
  };
}
