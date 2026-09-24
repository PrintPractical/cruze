import { headingElements, rowElements } from "../elements.ts";
import { designHash, elementHash } from "../hashing.ts";
import { findIds } from "../ids.ts";
import type { MarkdownDoc } from "../markdown.ts";
import { PATHS } from "../project/layout.ts";
import type { ProjectView } from "../project/project_view.ts";
import { featureOf } from "../project/work_items.ts";

/** What an approval pins: the document's design hash and the hash of everything upstream it relies on. */
export interface Fingerprint {
  hash: string;
  upstream: Record<string, string>;
}

/** Documents a person can approve. Specs, the glossary and ADRs change only through approved work. */
export function isApprovable(view: ProjectView, path: string): boolean {
  return [PATHS.vision, PATHS.architecture, PATHS.roadmap].includes(path as never) || view.items.some((i) => i.path === path && !i.archived);
}

export function fingerprint(view: ProjectView, path: string, doc: MarkdownDoc): Fingerprint {
  const upstream: Record<string, string> = {};
  const ownIds = new Set([...headingElements(doc), ...rowElements(doc)].filter((e) => e.op !== "ADDED").map((e) => e.id));
  const isLivingDoc = !view.items.some((item) => item.path === path);
  const designText = doc.lines.filter((_, i) => !doc.inManaged[i]).join("\n");

  for (const id of findIds(designText)) {
    if (isLivingDoc && ownIds.has(id)) continue;
    const living = view.living.elements.get(id);
    if (living !== undefined) upstream[id] = elementHash(living.doc, living.element);
  }
  const item = view.items.find((i) => i.path === path);
  if (item !== undefined) {
    // Work always depends on the dependency rules, cited or not.
    for (const [id, living] of view.living.elements) {
      if (id.startsWith("RULE-")) upstream[id] = elementHash(living.doc, living.element);
    }
    const feature = item.kind === "change" ? featureOf(view.items, item) : undefined;
    if (feature !== undefined) upstream[`doc:${feature.path}`] = designHash(feature.doc);
  }
  return { hash: designHash(doc), upstream };
}

/** The current hash of one upstream key, or undefined when it no longer exists. */
export function currentUpstreamHash(view: ProjectView, key: string): string | undefined {
  if (key.startsWith("doc:")) {
    const path = key.slice("doc:".length);
    const item = view.items.find((i) => i.path === path);
    return item === undefined ? undefined : designHash(item.doc);
  }
  const living = view.living.elements.get(key);
  return living === undefined ? undefined : elementHash(living.doc, living.element);
}
