import { ARCHITECTURE_KINDS } from "../architecture_sections.ts";
import { scopeOf } from "../ids.ts";
import { specPath } from "../project/layout.ts";
import { orphanDeltaElements, readDelta, type Delta } from "../project/deltas.ts";
import type { ProjectView } from "../project/project_view.ts";
import type { WorkItem } from "../project/work_items.ts";
import { elementProblems } from "./element_rules.ts";
import { error, type Problem } from "./problem.ts";

/** Merge records use this key for a spec file a delta created. */
export function capabilityKey(capability: string): string {
  return `CAPABILITY-${capability}`;
}

/** Marks an element a landed change removed. */
export const REMOVED_MARK = "removed";

/** Rules for the spec and architecture deltas of a feature or standalone change. */
export function deltaProblems(view: ProjectView, item: WorkItem): Problem[] {
  const { path, doc } = item;
  const delta = readDelta(doc);
  const merged = view.approvals.get(item.folder)?.merged ?? {};
  const problems: Problem[] = [];

  for (const orphan of orphanDeltaElements(doc)) {
    problems.push(error(path, orphan.start, "delta-shape", `${orphan.id} must sit under an ADDED, MODIFIED or REMOVED requirement`));
  }
  for (const { element, section, scenarios } of delta.entries) {
    const allowed = section === "spec" ? element.kind === "REQ" : ARCHITECTURE_KINDS.includes(element.kind);
    if (!allowed) problems.push(error(path, element.start, "delta-shape", `${element.id} does not belong in the ${section} delta`));
    problems.push(...elementProblems(path, doc, element));
    for (const scenario of scenarios) {
      problems.push(...elementProblems(path, doc, scenario));
      if (scopeOf(scenario.id) !== scopeOf(element.id)) {
        problems.push(error(path, scenario.start, "id-scope", `${scenario.id} must share its requirement's scope`));
      }
      problems.push(...opProblems(view, path, scenario.id, "ADDED", scenario.start, merged, element.op === "ADDED"));
    }
    problems.push(...opProblems(view, path, element.id, element.op ?? "ADDED", element.start, merged, false));
    if (element.kind === "REQ" && element.op === "ADDED") problems.push(...capabilityProblems(view, item, delta, element.id, element.start));
  }
  for (const op of delta.capabilities) {
    if (view.snapshot.has(specPath(op.capability)) && merged[capabilityKey(op.capability)] === undefined) {
      problems.push(error(path, op.start, "capability-exists", `capability ${op.capability} already has ${specPath(op.capability)}`));
    }
  }
  return problems;
}

function opProblems(
  view: ProjectView,
  path: string,
  id: string,
  op: "ADDED" | "MODIFIED" | "REMOVED",
  line: number,
  merged: Record<string, string>,
  underAddedRequirement: boolean,
): Problem[] {
  const exists = view.living.elements.has(id);
  const mergedHere = merged[id] !== undefined;
  if (view.retired.has(id)) return [error(path, line, "retired-id", `${id} was removed earlier and can never be reused`)];
  if (op === "ADDED" && exists && !mergedHere) {
    // A scenario under a MODIFIED requirement may already exist; only a new requirement's scenarios must be new.
    if (!id.startsWith("SCN-") || underAddedRequirement) return [error(path, line, "delta-op", `ADDED ${id} already exists in the living docs`)];
  }
  if ((op === "MODIFIED" || op === "REMOVED") && !exists && merged[id] !== REMOVED_MARK) {
    return [error(path, line, "delta-op", `${op} ${id} does not exist in the living docs`)];
  }
  return [];
}

function capabilityProblems(view: ProjectView, item: WorkItem, delta: Delta, id: string, line: number): Problem[] {
  const capability = scopeOf(id);
  if (capability === undefined) return [];
  const hasFile = view.snapshot.has(specPath(capability));
  const addsFile = delta.capabilities.some((op) => op.capability === capability);
  if (hasFile || addsFile) return [];
  return [error(item.path, line, "capability-missing", `${id} needs ${specPath(capability)}, or an "ADDED CAPABILITY ${capability}" operation`)];
}
