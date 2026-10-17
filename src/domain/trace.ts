import { findScenarioIds } from "./ids.ts";
import type { Feature } from "./project/features.ts";

export interface TraceReport {
  /** Scenarios that must have a test, and the test files that carry each one. */
  scenarios: Array<{ id: string; tests: string[] }>;
  missing: string[];
  /** Scenario IDs in tests that no feature document defines. */
  unknown: Array<{ id: string; path: string; line: number }>;
}

/** Links the required features' scenarios to the tests that carry their IDs. */
export function traceScenarios(features: readonly Feature[], required: readonly Feature[], tests: ReadonlyMap<string, string>): TraceReport {
  const known = new Set(features.flatMap((f) => f.scenarios.map((s) => s.id)));
  const carriers = new Map<string, string[]>();
  const unknown: TraceReport["unknown"] = [];
  for (const [path, text] of tests) {
    text.split("\n").forEach((line, index) => {
      for (const id of findScenarioIds(line)) {
        carriers.set(id, [...new Set([...(carriers.get(id) ?? []), path])]);
        if (!known.has(id)) unknown.push({ id, path, line: index + 1 });
      }
    });
  }
  const scenarios = required.flatMap((f) => f.scenarios).map((s) => ({ id: s.id, tests: carriers.get(s.id) ?? [] }));
  return { scenarios, missing: scenarios.filter((s) => s.tests.length === 0).map((s) => s.id), unknown };
}
