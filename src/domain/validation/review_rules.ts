import { parse as parseYaml } from "yaml";
import { PATHS } from "../project/layout.ts";
import type { ProjectDocs } from "../project/project_docs.ts";
import { warning, type Problem } from "./problem.ts";

/**
 * Warns when a feature is built but `review.command` is still the one `cruze init`
 * wrote: the foundation never added the project's test commands, so the code
 * reviewer can only read the code. `initSetting` is the review template init renders.
 */
export function reviewCommandProblems(docs: ProjectDocs, initSetting: string): Problem[] {
  const command = docs.config?.config?.review.command;
  if (command === undefined || !docs.features.some((feature) => feature.status === "built")) return [];
  if (JSON.stringify(command) !== JSON.stringify(initCommand(initSetting))) return [];
  return [warning(PATHS.config, undefined, "review-tests", "review.command is still the one cruze init wrote, so the code reviewer can't run the project's tests; add its test and lint commands as .agents/skills/cruze-formats/config.md shows")];
}

function initCommand(setting: string): unknown {
  const parsed: unknown = parseYaml(setting);
  return (parsed as { review?: { command?: unknown } } | null)?.review?.command;
}
