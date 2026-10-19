import { hasErrors, validateProject } from "../../domain/validation/validate_project.ts";
import { warning, type Problem } from "../../domain/validation/problem.ts";
import { PATHS } from "../../domain/project/layout.ts";
import { reviewSettingTemplate } from "../../domain/scaffold.ts";
import { reviewCommandProblems } from "../../domain/validation/review_rules.ts";
import { versionSkew } from "../../domain/versions/cruze_version.ts";
import type { Bundle } from "../ports/bundle.ts";
import type { ProjectFiles } from "../ports/project_files.ts";
import { loadDocs } from "../project_context.ts";

export interface ValidateReport {
  valid: boolean;
  errors: number;
  warnings: number;
  problems: Problem[];
}

/** Checks every document in the project against the cruze-formats rules, that its skills match this CLI, and that its reviewer can run the tests. */
export async function validate(deps: { files: ProjectFiles; bundle: Bundle }): Promise<ValidateReport> {
  const docs = await loadDocs(deps.files);
  const config = docs.config?.config;
  const skew = config === null || config === undefined ? undefined : versionSkew(deps.bundle.version, config.cruze);
  const review = reviewCommandProblems(docs, await deps.bundle.template(reviewSettingTemplate("claude")));
  const problems = [...validateProject(docs), ...(skew === undefined ? [] : [warning(PATHS.config, undefined, "cruze-version", skew.message)]), ...review];
  return {
    valid: !hasErrors(problems),
    errors: problems.filter((p) => p.severity === "error").length,
    warnings: problems.filter((p) => p.severity === "warning").length,
    problems,
  };
}
