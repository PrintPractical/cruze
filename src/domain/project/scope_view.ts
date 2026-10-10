import { elementLines, type DeltaOp, type Element } from "../elements.ts";
import { findIds } from "../ids.ts";
import { findSection, type MarkdownDoc } from "../markdown.ts";
import { readDelta } from "./deltas.ts";
import { readScope } from "./plan_parts.ts";
import type { ProjectView } from "./project_view.ts";
import { featureOf, type WorkItem, type WorkItemKind } from "./work_items.ts";

/**
 * The design a piece of work builds, cut out of the documents that hold it, so a step reads
 * the elements in its scope instead of the whole architecture and the whole feature.
 */

export interface ShownElement {
  id: string;
  title: string;
  op?: DeltaOp;
  /** Where the body comes from, as `<path>:<line>`. */
  source: string;
  body: string[];
}

export interface CitedElement {
  id: string;
  title: string;
  source: string;
}

export interface ScopeView {
  ref: string;
  kind: WorkItemKind;
  feature?: string;
  /** The architecture elements the work builds or removes; for a feature, its whole architecture delta. */
  elements: ShownElement[];
  /** The scenarios and requirements the work delivers; for a feature, its whole spec delta. */
  scenarios: ShownElement[];
  /** Elements the shown bodies cite but don't include, with where to read them. */
  cited: CitedElement[];
  /** The settled decisions of the feature, then of the change. */
  decisions: string[];
  /** Scope IDs defined nowhere: the delta, the living docs or the archive. */
  missing: string[];
}

interface Located {
  doc: MarkdownDoc;
  path: string;
  element: Element;
}

export function scopeView(view: ProjectView, item: WorkItem): ScopeView {
  const feature = featureOf(view.items, item);
  const deltaItem = feature ?? item;
  const locate = locator(view, deltaItem);
  const wanted = item.kind === "change" || item.kind === "standalone" ? changeIds(item) : featureIds(deltaItem);
  const missing: string[] = [];
  const show = (ids: string[]): ShownElement[] =>
    ids.flatMap((id) => {
      const found = locate(id);
      if (found === undefined) {
        missing.push(id);
        return [];
      }
      const shown: ShownElement = { id, title: found.element.title, source: `${found.path}:${found.element.start + 1}`, body: elementLines(found.doc, found.element) };
      if (found.element.op !== undefined) shown.op = found.element.op;
      return [shown];
    });
  const elements = show(wanted.elements);
  const scenarios = show(wanted.scenarios);
  const shownIds = new Set([...elements, ...scenarios].map((e) => e.id));
  const cited = [...new Set([...elements, ...scenarios].flatMap((e) => findIds(e.body.join("\n"))))]
    .filter((id) => !shownIds.has(id))
    .flatMap((id) => {
      const found = locate(id);
      return found === undefined ? [] : [{ id, title: found.element.title, source: `${found.path}:${found.element.start + 1}` }];
    });
  const decisions = feature === undefined ? decisionLines(item.doc) : [...decisionLines(feature.doc), ...decisionLines(item.doc)];
  const result: ScopeView = { ref: item.ref, kind: item.kind, elements, scenarios, cited, decisions, missing };
  if (feature !== undefined) result.feature = feature.ref;
  return result;
}

/** A change shows what its scope builds, removes and delivers. */
function changeIds(change: WorkItem): { elements: string[]; scenarios: string[] } {
  const scope = readScope(change.doc);
  return { elements: [...(scope?.builds ?? []), ...(scope?.removes ?? [])], scenarios: scope?.delivers ?? [] };
}

/** A feature shows its whole delta: every operation, with a requirement's scenarios inside its body. */
function featureIds(feature: WorkItem): { elements: string[]; scenarios: string[] } {
  const entries = readDelta(feature.doc).entries;
  return {
    elements: entries.filter((e) => e.section === "architecture").map((e) => e.element.id),
    scenarios: entries.filter((e) => e.section === "spec").map((e) => e.element.id),
  };
}

/** Finds an element's body in the work's own delta first, since that is the text the work builds, then in the living docs. */
function locator(view: ProjectView, deltaItem: WorkItem): (id: string) => Located | undefined {
  const delta = readDelta(deltaItem.doc);
  const inDelta = new Map<string, Element>();
  for (const entry of delta.entries) {
    inDelta.set(entry.element.id, entry.element);
    for (const scenario of entry.scenarios) inDelta.set(scenario.id, scenario);
  }
  return (id) => {
    const own = inDelta.get(id);
    if (own !== undefined) return { doc: deltaItem.doc, path: deltaItem.path, element: own };
    const living = view.living.elements.get(id);
    return living === undefined ? undefined : { doc: living.doc, path: living.path, element: living.element };
  };
}

function decisionLines(doc: MarkdownDoc): string[] {
  const section = findSection(doc, "Settled decisions");
  if (section === null) return [];
  return doc.lines.slice(section.start, section.end).filter((line) => line.startsWith("- "));
}
