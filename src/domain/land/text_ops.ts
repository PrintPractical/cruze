import { headingElements, isStatusLine } from "../elements.ts";
import { parseMarkdown, type MarkdownDoc } from "../markdown.ts";

/** Line-level edits land makes to living documents. Every function takes and returns whole text. */

/**
 * A delta block ready for a living document: headings shifted so the element's own heading
 * sits at `level`, the operation prefix dropped, status lines removed, trailing blanks trimmed.
 */
export function relevel(doc: MarkdownDoc, start: number, end: number, level: number): string[] {
  const own = /^(#{1,6}) /.exec(doc.lines[start] ?? "")?.[1]?.length ?? level;
  const shift = level - own;
  const out: string[] = [];
  for (let i = start; i < end; i++) {
    let line = doc.lines[i] ?? "";
    if (!doc.inFence[i]) {
      if (isStatusLine(line)) continue;
      const heading = /^(#{1,6}) (.*)$/.exec(line);
      if (heading?.[1] !== undefined && heading[2] !== undefined) {
        const text = i === start ? heading[2].replace(/^(ADDED|MODIFIED|REMOVED) /, "") : heading[2];
        line = `${"#".repeat(heading[1].length + shift)} ${text}`;
      }
    }
    out.push(line);
  }
  while (out.length > 0 && out[out.length - 1]?.trim() === "") out.pop();
  return out;
}

/** Replaces an element's whole block, keeping one blank line before whatever follows. */
export function replaceElement(text: string, id: string, block: string[]): string {
  const doc = parseMarkdown(text);
  const element = headingElements(doc).find((e) => e.id === id);
  if (element === undefined) throw new Error(`${id} is not in the document`);
  const lines = [...doc.lines];
  const follows = element.end < lines.length;
  lines.splice(element.start, element.end - element.start, ...block, ...(follows ? [""] : []));
  return lines.join("\n");
}

export function removeElement(text: string, id: string): string {
  const doc = parseMarkdown(text);
  const element = headingElements(doc).find((e) => e.id === id);
  if (element === undefined) return text;
  const lines = [...doc.lines];
  lines.splice(element.start, element.end - element.start);
  return lines.join("\n");
}

/** Appends a block at the end of a `##` section, or at the end of the document when none is named. */
export function appendBlock(text: string, block: string[], section?: string): string {
  const doc = parseMarkdown(text);
  const lines = [...doc.lines];
  let at = lines.length;
  if (section !== undefined) {
    const heading = doc.headings.find((h) => h.level === 2 && h.text === section);
    if (heading === undefined) throw new Error(`the document has no "## ${section}" section`);
    at = doc.headings.find((h) => h.line > heading.line && h.level <= 2)?.line ?? lines.length;
  }
  let insertAt = at;
  while (insertAt > 0 && lines[insertAt - 1]?.trim() === "") insertAt--;
  const trailing = at < lines.length ? [""] : [];
  lines.splice(insertAt, at - insertAt, "", ...block, ...trailing);
  const joined = lines.join("\n");
  return joined.endsWith("\n") ? joined : `${joined}\n`;
}
