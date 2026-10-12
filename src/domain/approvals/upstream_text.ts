import { isStatusLine } from "../elements.ts";
import { designHash, elementHash } from "../hashing.ts";
import { parseMarkdown, type MarkdownDoc } from "../markdown.ts";
import { buildLivingModel } from "../project/living_model.ts";
import type { ProjectView } from "../project/project_view.ts";

/** The document that holds an upstream key now: an element's living document, or the path of a `doc:` key. */
export function upstreamPath(view: ProjectView, key: string): string | undefined {
  if (key.startsWith("doc:")) return view.snapshot.has(key.slice("doc:".length)) ? key.slice("doc:".length) : undefined;
  return view.living.elements.get(key)?.path;
}

/**
 * The design lines behind an upstream key in one version of the document at `path`, without the
 * managed blocks and status lines no hash covers. With `pinned`, only when they hash as pinned.
 */
export function upstreamLines(key: string, path: string, text: string, pinned?: string): string[] | undefined {
  if (key.startsWith("doc:")) {
    const doc = parseMarkdown(text);
    if (pinned !== undefined && designHash(doc) !== pinned) return undefined;
    return designLines(doc, 0, doc.lines.length);
  }
  const living = buildLivingModel(new Map([[path, text]])).elements.get(key);
  if (living === undefined) return undefined;
  if (pinned !== undefined && elementHash(living.doc, living.element) !== pinned) return undefined;
  return designLines(living.doc, living.element.start, living.element.end);
}

function designLines(doc: MarkdownDoc, start: number, end: number): string[] {
  const lines: string[] = [];
  for (let i = start; i < end; i++) {
    const line = doc.lines[i] ?? "";
    if (!doc.inManaged[i] && (doc.inFence[i] || !isStatusLine(line))) lines.push(line);
  }
  return lines;
}
