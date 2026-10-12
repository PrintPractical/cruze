import { elementLines, factsOf, statusOf, type DeltaOp, type Element, type Status } from "../elements.ts";
import { findIds, kindOf, scopeOf, type Kind } from "../ids.ts";
import type { MarkdownDoc } from "../markdown.ts";
import { readDelta } from "./deltas.ts";
import { PATHS } from "./layout.ts";
import type { ProjectView } from "./project_view.ts";
import type { ShownElement } from "./scope_view.ts";
import type { WorkItem } from "./work_items.ts";

/**
 * Elements one at a time, and an index of all of them, so a step that needs a few elements of a
 * large architecture fetches those instead of reading the whole file. One project's architecture
 * held 52k words, and a single architect run read all of it to find what it would extend.
 */

export interface IndexEntry {
  id: string;
  title: string;
  kind: Kind;
  /** The living document that holds it, or the work item that adds it. */
  source: string;
  status?: Status;
  /** Where its code lives: the `Module` it names, or a module's `Path`. */
  place?: string;
  /** For a requirement, how many scenarios it holds. */
  scenarios?: number;
  /** Work in flight whose delta changes or removes it. */
  changedBy: string[];
  /** Set when only in-flight work defines it so far. */
  addedBy?: string;
}

export interface ElementIndex {
  /** The words in the living architecture and specs, so a step can judge whether to read them whole. */
  words: { architecture: number; specs: number };
  entries: IndexEntry[];
}

const DOCS_INDEXED = (path: string): boolean => path === PATHS.architecture || path.startsWith(`${PATHS.specsDir}/`);

/**
 * Every element of the living architecture and specs, one entry each, with what in-flight work
 * adds. Without a scope, scenarios are counted under their requirement; with a context or
 * capability name, only its elements are listed, scenarios included.
 */
export function elementIndex(view: ProjectView, scope?: string): ElementIndex {
  const inScope = (id: string): boolean => scope === undefined || scopeOf(id) === scope || id === `CTX-${scope}`;
  const entries: IndexEntry[] = [];
  const byId = new Map<string, IndexEntry>();
  for (const living of view.living.elements.values()) {
    if (!DOCS_INDEXED(living.path) || !inScope(living.id) || (scope === undefined && kindOf(living.id) === "SCN")) continue;
    const entry = entryOf(living.id, living.element, living.doc, living.path);
    if (kindOf(living.id) === "REQ") entry.scenarios = scenarioCount(view, living.id);
    entries.push(entry);
    byId.set(entry.id, entry);
  }
  for (const item of inFlight(view)) {
    for (const element of deltaElements(item)) {
      if (!inScope(element.element.id) || (scope === undefined && element.element.kind === "SCN")) continue;
      const known = byId.get(element.element.id);
      if (known !== undefined) {
        known.changedBy.push(item.ref);
        continue;
      }
      const added = { ...entryOf(element.element.id, element.element, item.doc, item.ref), addedBy: item.ref };
      entries.push(added);
      byId.set(added.id, added);
    }
  }
  return { words: livingWords(view), entries };
}

/** The bodies of the named elements: the living one, then each in-flight delta that changes it. */
export function lookupElements(view: ProjectView, ids: string[]): { elements: ShownElement[]; missing: string[] } {
  const elements: ShownElement[] = [];
  const missing: string[] = [];
  for (const id of ids) {
    const found: ShownElement[] = [];
    const living = view.living.elements.get(id);
    if (living !== undefined) found.push(shown(living.doc, living.element, living.path));
    for (const item of inFlight(view)) {
      const delta = deltaElements(item).find((d) => d.element.id === id);
      if (delta !== undefined) found.push({ ...shown(item.doc, delta.element, item.path), ...(delta.op === undefined ? {} : { op: delta.op }) });
    }
    if (found.length === 0) missing.push(id);
    elements.push(...found);
  }
  return { elements, missing };
}

function entryOf(id: string, element: Element, doc: MarkdownDoc, source: string): IndexEntry {
  const facts = factsOf(doc, element);
  const place = (facts.get("Module") ?? []).flatMap(findIds)[0] ?? (facts.get("Path") ?? [])[0];
  const status = statusOf(doc, element);
  return { id, title: element.title, kind: kindOf(id), source, changedBy: [], ...(status === undefined ? {} : { status }), ...(place === undefined ? {} : { place }) };
}

function shown(doc: MarkdownDoc, element: Element, path: string): ShownElement {
  return { id: element.id, title: element.title, source: `${path}:${element.start + 1}`, body: elementLines(doc, element) };
}

function inFlight(view: ProjectView): WorkItem[] {
  return view.items.filter((item) => !item.archived && item.kind !== "change");
}

/** Each element a work item's delta defines or changes, scenarios under a requirement included. */
function deltaElements(item: WorkItem): Array<{ element: Element; op?: DeltaOp }> {
  return readDelta(item.doc).entries.flatMap((entry) => [
    { element: entry.element, ...(entry.element.op === undefined ? {} : { op: entry.element.op }) },
    ...entry.scenarios.map((scenario) => ({ element: scenario })),
  ]);
}

function scenarioCount(view: ProjectView, requirement: string): number {
  const living = view.living.elements.get(requirement);
  if (living === undefined) return 0;
  return [...view.living.elements.values()].filter((e) => e.path === living.path && e.id.startsWith("SCN-") && e.element.start > living.element.start && e.element.start < living.element.end).length;
}

function livingWords(view: ProjectView): { architecture: number; specs: number } {
  const words = (path: string): number => (view.snapshot.get(path) ?? "").split(/\s+/).filter((w) => w !== "").length;
  const specs = [...view.living.docs.keys()].filter((path) => path.startsWith(`${PATHS.specsDir}/`));
  return { architecture: words(PATHS.architecture), specs: specs.reduce((sum, path) => sum + words(path), 0) };
}
