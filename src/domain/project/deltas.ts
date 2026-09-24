import { capabilityOps, headingElements, type CapabilityOp, type Element } from "../elements.ts";
import { findSection, type MarkdownDoc } from "../markdown.ts";

/** One delta operation on a living element, with its nested scenarios when it is a requirement. */
export interface DeltaEntry {
  element: Element;
  section: "spec" | "architecture";
  /** Scenario elements nested under a requirement operation. */
  scenarios: Element[];
}

export interface Delta {
  entries: DeltaEntry[];
  capabilities: CapabilityOp[];
  /** Every ID a delta defines or changes, including nested scenarios. */
  ids: Set<string>;
}

export function readDelta(doc: MarkdownDoc): Delta {
  const entries: DeltaEntry[] = [];
  const capabilities: CapabilityOp[] = [];
  for (const [title, section] of [["Spec delta", "spec"], ["Architecture delta", "architecture"]] as const) {
    const range = findSection(doc, title);
    if (range === null) continue;
    capabilities.push(...capabilityOps(doc, range.start, range.end));
    const elements = headingElements(doc, range.start, range.end);
    for (const element of elements.filter((e) => e.op !== undefined)) {
      const scenarios = elements.filter((e) => e.op === undefined && e.start > element.start && e.start < element.end);
      entries.push({ element, section, scenarios });
    }
  }
  const ids = new Set(entries.flatMap((entry) => [entry.element.id, ...entry.scenarios.map((s) => s.id)]));
  return { entries, capabilities, ids };
}

/** Scenario elements that sit under no requirement operation: always a format error. */
export function orphanDeltaElements(doc: MarkdownDoc): Element[] {
  const orphans: Element[] = [];
  for (const title of ["Spec delta", "Architecture delta"]) {
    const range = findSection(doc, title);
    if (range === null) continue;
    const elements = headingElements(doc, range.start, range.end);
    const ops = elements.filter((e) => e.op !== undefined);
    for (const element of elements.filter((e) => e.op === undefined)) {
      if (!ops.some((op) => element.start > op.start && element.start < op.end)) orphans.push(element);
    }
  }
  return orphans;
}
