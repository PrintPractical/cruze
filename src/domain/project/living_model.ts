import { headingElements, rowElements, type Element } from "../elements.ts";
import { parseMarkdown, type MarkdownDoc } from "../markdown.ts";
import { PATHS, childFiles, type Snapshot } from "./layout.ts";

/** An element of the living docs, with the document it lives in. */
export interface LivingElement {
  id: string;
  path: string;
  doc: MarkdownDoc;
  element: Element;
}

/** The living docs: vision, architecture, specs and ADRs, indexed by element ID. */
export interface LivingModel {
  docs: Map<string, MarkdownDoc>;
  elements: Map<string, LivingElement>;
  /** IDs defined more than once, with every place they appear. */
  duplicates: Array<{ id: string; places: string[] }>;
}

export function livingDocPaths(snapshot: Snapshot): string[] {
  const fixed = [PATHS.vision, PATHS.architecture].filter((path) => snapshot.has(path));
  return [...fixed, ...childFiles(snapshot, PATHS.specsDir, ".md"), ...childFiles(snapshot, PATHS.adrDir, ".md")];
}

export function buildLivingModel(snapshot: Snapshot): LivingModel {
  const docs = new Map<string, MarkdownDoc>();
  const elements = new Map<string, LivingElement>();
  const places = new Map<string, string[]>();

  for (const path of livingDocPaths(snapshot)) {
    const doc = parseMarkdown(snapshot.get(path) ?? "");
    docs.set(path, doc);
    for (const element of elementsOf(path, doc)) {
      places.set(element.id, [...(places.get(element.id) ?? []), `${path}:${element.start + 1}`]);
      if (!elements.has(element.id)) elements.set(element.id, { id: element.id, path, doc, element });
    }
  }
  const duplicates = [...places].filter(([, at]) => at.length > 1).map(([id, at]) => ({ id, places: at }));
  return { docs, elements, duplicates };
}

/** The ID an ADR file defines: `ADR-<file stem>`. */
export function adrId(path: string): string {
  return `ADR-${path.slice(path.lastIndexOf("/") + 1, -".md".length)}`;
}

function elementsOf(path: string, doc: MarkdownDoc): Element[] {
  if (path.startsWith(`${PATHS.adrDir}/`)) {
    return [{ id: adrId(path), kind: "ADR", title: doc.headings[0]?.text ?? "", form: "heading", level: 1, start: 0, end: doc.lines.length }];
  }
  if (path === PATHS.vision) return rowElements(doc).filter((element) => element.kind === "GOAL");
  return headingElements(doc);
}
