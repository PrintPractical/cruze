import { DEFAULT_CHANGE_LIMITS, type ChangeLimits } from "../config.ts";
import { kindOf } from "../ids.ts";
import type { ChangeRow } from "../project/plan_parts.ts";
import type { ProjectView } from "../project/project_view.ts";
import { warning, type Problem } from "./problem.ts";

/**
 * Every change pays for its own plan review, code review, verifier run and land, so a change
 * should carry enough work to be worth them, and no more than one review and one run can hold.
 */
export function changeLimits(view: ProjectView): ChangeLimits {
  return view.config?.config?.changes ?? DEFAULT_CHANGE_LIMITS;
}

/** A feature's changes not yet landed that fall outside the size band. A feature of one change has nothing to merge into. */
export function changeRowSizeProblems(view: ProjectView, path: string, rows: ChangeRow[], landed: Set<string>): Problem[] {
  const limits = changeLimits(view);
  const problems: Problem[] = [];
  for (const row of rows.filter((r) => !landed.has(r.change))) {
    if (rows.length > 1 && row.builds.length < limits.minBuilds) {
      problems.push(warning(path, row.line, "change-too-small", `${row.change} builds ${row.builds.length} element(s), under ${limits.minBuilds}; merge it into the change it continues, since each change pays for its own plan, review and verify`));
    }
    const scenarios = row.delivers.filter((id) => kindOf(id) === "SCN").length;
    if (scenarios > limits.maxScenarios) {
      problems.push(warning(path, row.line, "change-too-large", `${row.change} delivers ${scenarios} scenarios, over ${limits.maxScenarios}; split it, since one verifier run has to go through them all`));
    }
  }
  return problems;
}

/** A plan with more tasks than one code review and one verify can hold. */
export function planSizeProblems(view: ProjectView, path: string, tasks: number): Problem[] {
  const { maxTasks } = changeLimits(view);
  if (tasks <= maxTasks) return [];
  return [warning(path, undefined, "plan-too-large", `the plan has ${tasks} tasks, over ${maxTasks}; split the change through rethink at feature level`)];
}
