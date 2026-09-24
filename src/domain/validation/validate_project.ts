import type { ProjectView } from "../project/project_view.ts";
import { livingProblems } from "./living_rules.ts";
import { error, sortProblems, type Problem } from "./problem.ts";
import { configProblems, roadmapProblems, templateLeftovers } from "./project_rules.ts";
import { workItemProblems } from "./work_item_rules.ts";

/** Every rule in the cruze-formats skill, applied to the whole project. */
export function validateProject(view: ProjectView): Problem[] {
  const approvalProblems = [...view.approvalProblems].map(([path, message]) => error(path, undefined, "approvals-file", message));
  const journalProblems = [...view.journalProblems].flatMap(([path, lines]) =>
    lines.map((line) => error(path, line - 1, "journal-line", "this journal line is not a valid entry")),
  );
  return sortProblems([
    ...configProblems(view),
    ...livingProblems(view),
    ...roadmapProblems(view),
    ...workItemProblems(view),
    ...templateLeftovers(view),
    ...approvalProblems,
    ...journalProblems,
  ]);
}

/** Problems that concern one document. */
export function problemsFor(problems: Problem[], path: string): Problem[] {
  return problems.filter((problem) => problem.path === path);
}

export function hasErrors(problems: Problem[]): boolean {
  return problems.some((problem) => problem.severity === "error");
}
