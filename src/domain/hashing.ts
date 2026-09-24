import { createHash } from "node:crypto";
import { elementLines, isStatusLine, type Element } from "./elements.ts";
import type { MarkdownDoc } from "./markdown.ts";

/**
 * Hashes cover design content only. Managed blocks and status lines are
 * excluded, so bookkeeping by the CLI never makes a design look edited.
 */

export function sha256(text: string): string {
  return `sha256:${createHash("sha256").update(text).digest("hex")}`;
}

/** Hash of a whole document's design content. */
export function designHash(doc: MarkdownDoc): string {
  const kept = doc.lines.filter((line, i) => !doc.inManaged[i] && (doc.inFence[i] || !isStatusLine(line)));
  return sha256(normalize(kept));
}

/**
 * Hash of one element, independent of where it sits: heading levels are made
 * relative to the element and a delta operation prefix is dropped, so an element
 * hashes the same in a delta and after it is merged into a living document.
 */
export function elementHash(doc: MarkdownDoc, element: Element): string {
  if (element.form === "row") return sha256(normalize(elementLines(doc, element)));
  const kept: string[] = [];
  for (let i = element.start; i < element.end; i++) {
    const line = doc.lines[i] ?? "";
    if (doc.inManaged[i] || (!doc.inFence[i] && isStatusLine(line))) continue;
    kept.push(doc.inFence[i] ? line : relativeHeading(line, element.level, i === element.start));
  }
  return sha256(normalize(kept));
}

function relativeHeading(line: string, baseLevel: number, isOwnHeading: boolean): string {
  const match = /^(#{1,6}) (.*)$/.exec(line);
  if (match?.[1] === undefined || match[2] === undefined) return line;
  const text = isOwnHeading ? match[2].replace(/^(ADDED|MODIFIED|REMOVED) /, "") : match[2];
  return `${"#".repeat(match[1].length - baseLevel + 1)} ${text}`;
}

function normalize(lines: string[]): string {
  const out: string[] = [];
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (line === "" && (out.length === 0 || out[out.length - 1] === "")) continue;
    out.push(line);
  }
  while (out.length > 0 && out[out.length - 1] === "") out.pop();
  return out.join("\n");
}
