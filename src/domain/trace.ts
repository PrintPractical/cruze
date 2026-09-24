import { headingElements, statusOf } from "./elements.ts";
import { findIds } from "./ids.ts";
import { PATHS } from "./project/layout.ts";
import type { ProjectView } from "./project/project_view.ts";
import { readScope } from "./project/plan_parts.ts";
import { readDelta } from "./project/deltas.ts";
import type { WorkItem } from "./project/work_items.ts";

export interface TraceReport {
  /** Scenarios that must have a test, and the test files that carry each one. */
  scenarios: Array<{ id: string; tests: string[] }>;
  missing: string[];
  /** Scenario IDs in tests that no living doc or active delta defines. */
  unknown: Array<{ id: string; path: string; line: number }>;
}

/**
 * Links scenarios to the tests that prove them. For a change: every scenario it delivers.
 * For the whole project: every built scenario in the living specs.
 */
export function traceScenarios(view: ProjectView, tests: ReadonlyMap<string, string>, change?: WorkItem): TraceReport {
  const required = change === undefined ? builtScenarios(view) : (readScope(change.doc)?.delivers ?? []).filter((id) => id.startsWith("SCN-"));
  const known = new Set([...view.living.elements.keys()]);
  for (const item of view.items.filter((i) => !i.archived)) for (const id of readDelta(item.doc).ids) known.add(id);

  const carriers = new Map<string, string[]>();
  const unknown: TraceReport["unknown"] = [];
  for (const [path, text] of tests) {
    text.split("\n").forEach((line, index) => {
      for (const id of findIds(line).filter((id) => id.startsWith("SCN-"))) {
        carriers.set(id, [...new Set([...(carriers.get(id) ?? []), path])]);
        if (!known.has(id)) unknown.push({ id, path, line: index + 1 });
      }
    });
  }
  const scenarios = required.map((id) => ({ id, tests: carriers.get(id) ?? [] }));
  return { scenarios, missing: scenarios.filter((s) => s.tests.length === 0).map((s) => s.id), unknown };
}

function builtScenarios(view: ProjectView): string[] {
  return [...view.living.docs]
    .filter(([path]) => path.startsWith(`${PATHS.specsDir}/`))
    .flatMap(([, doc]) => headingElements(doc).filter((e) => e.kind === "SCN" && statusOf(doc, e) === "built").map((e) => e.id));
}
