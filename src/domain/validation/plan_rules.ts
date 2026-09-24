import { factsOf, statusOf } from "../elements.ts";
import { findIds, kindOf } from "../ids.ts";
import type { MarkdownDoc } from "../markdown.ts";
import type { Delta } from "../project/deltas.ts";
import { readScope, readTasks, readTestPlan, type Scope } from "../project/plan_parts.ts";
import type { ProjectView } from "../project/project_view.ts";
import { error, warning, type Problem } from "./problem.ts";

const TEST_KINDS = ["behaviour", "contract", "domain", "smoke"];

/**
 * Rules for one buildable change: its scope names only things that can be built,
 * every scope ID is proved by a task, every delivered scenario has a behaviour test, and
 * every port a built adapter implements has a contract test.
 */
export function changePlanProblems(
  view: ProjectView,
  path: string,
  doc: MarkdownDoc,
  delta: { delta: Delta; doc: MarkdownDoc },
  available: Set<string>,
): Problem[] {
  const scope = readScope(doc);
  if (scope === null) return [error(path, undefined, "missing-section", 'the change needs a "## Scope" section')];
  const problems: Problem[] = [...scopeTargetProblems(view, path, scope, delta.delta)];
  const { tasks, malformed } = readTasks(doc);
  for (const line of malformed) {
    problems.push(error(path, line, "task-format", "task lines read: - T<n>: `<owner>` in `<path>`[, `<path>`], proves <ID>[, <ID>]"));
  }
  if (tasks.length === 0 && malformed.length === 0) problems.push(error(path, undefined, "missing-tasks", "the change has no tasks"));

  const proved = new Set(tasks.flatMap((task) => task.proves));
  const taskPaths = tasks.flatMap((task) => task.paths);
  for (const task of tasks) {
    for (const id of task.proves.filter((id) => !available.has(id))) {
      problems.push(error(path, task.line, "unknown-id", `${task.number} proves ${id}, which is not defined`));
    }
  }
  for (const id of [...scope.delivers, ...scope.builds]) {
    if (kindOf(id) === "MOD") {
      const modulePaths = modulePathsOf(view, delta.doc, delta.delta, id);
      if (!taskPaths.some((p) => modulePaths.some((m) => p.startsWith(m)))) {
        problems.push(error(path, scope.line, "unproved-scope", `${id} is in scope but no task writes inside ${modulePaths.join(" or ") || "its path"}`));
      }
    } else if (kindOf(id) === "REQ") {
      const scenarios = delta.delta.entries.find((e) => e.element.id === id)?.scenarios.map((s) => s.id) ?? [];
      if (!proved.has(id) && !scenarios.some((s) => proved.has(s))) problems.push(error(path, scope.line, "unproved-scope", `no task proves ${id} or its scenarios`));
    } else if (!proved.has(id)) {
      problems.push(error(path, scope.line, "unproved-scope", `${id} is in scope but no task proves it`));
    }
  }

  const rows = readTestPlan(doc);
  for (const row of rows) {
    if (!TEST_KINDS.includes(row.kind)) problems.push(error(path, row.line, "test-kind", `test kind must be one of ${TEST_KINDS.join(", ")}`));
    const subject = findIds(row.subject)[0];
    if (subject === undefined || !available.has(subject)) problems.push(error(path, row.line, "unknown-id", `test subject "${row.subject}" is not a defined ID`));
    if (row.file === "") problems.push(error(path, row.line, "test-file", "every test plan row names its test file"));
  }
  for (const id of scope.delivers.filter((id) => kindOf(id) === "SCN")) {
    if (!rows.some((row) => findIds(row.subject)[0] === id && row.kind === "behaviour")) {
      problems.push(error(path, scope.line, "missing-behaviour-test", `${id} is delivered but has no behaviour row in the test plan`));
    }
  }
  for (const adapter of scope.builds.filter((id) => kindOf(id) === "ADP")) {
    const ports = (factsOfScoped(view, delta.doc, delta.delta, adapter).get("Implements") ?? []).flatMap(findIds).filter((id) => kindOf(id) === "PORT");
    for (const port of ports.filter((p) => !rows.some((row) => findIds(row.subject)[0] === p && row.kind === "contract"))) {
      problems.push(error(path, scope.line, "missing-contract-test", `${adapter} implements ${port} but the test plan has no contract row for ${port}`));
    }
  }
  return problems;
}

/** Scope IDs must come from the item's deltas or be planned in the living docs. */
function scopeTargetProblems(view: ProjectView, path: string, scope: Scope, delta: Delta): Problem[] {
  const problems: Problem[] = [];
  for (const id of [...scope.delivers, ...scope.builds]) {
    if (delta.ids.has(id)) continue;
    const living = view.living.elements.get(id);
    if (living === undefined) problems.push(error(path, scope.line, "unknown-id", `${id} is in scope but defined nowhere`));
    else if (statusOf(living.doc, living.element) !== "planned") {
      problems.push(error(path, scope.line, "scope-not-planned", `${id} is already built; change it through a MODIFIED operation in the delta`));
    }
  }
  for (const id of scope.removes) {
    const removal = delta.entries.find((e) => e.element.id === id && e.element.op === "REMOVED");
    if (removal === undefined) problems.push(error(path, scope.line, "scope-removes", `${id} is in Removes but the delta has no REMOVED operation for it`));
  }
  if (scope.delivers.length + scope.builds.length + scope.removes.length === 0) {
    problems.push(warning(path, scope.line, "empty-scope", "the scope delivers and builds nothing"));
  }
  return problems;
}

/** An element's facts as this item will build it: from its delta when it has one, else from the living docs. */
function factsOfScoped(view: ProjectView, doc: MarkdownDoc, delta: Delta, id: string): Map<string, string[]> {
  const fromDelta = delta.entries.find((e) => e.element.id === id);
  const living = view.living.elements.get(id);
  return fromDelta !== undefined ? factsOf(doc, fromDelta.element) : living !== undefined ? factsOf(living.doc, living.element) : new Map<string, string[]>();
}

function modulePathsOf(view: ProjectView, doc: MarkdownDoc, delta: Delta, id: string): string[] {
  return (factsOfScoped(view, doc, delta, id).get("Path") ?? []).flatMap((value) => [...value.matchAll(/`([^`]+)`/g)].map((m) => m[1] ?? "")).filter((p) => p !== "");
}
