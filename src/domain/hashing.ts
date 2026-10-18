import { createHash } from "node:crypto";
import { findSection, type MarkdownDoc } from "./markdown.ts";

/**
 * Hashes cover design content only. A feature's `- Status:` line is bookkeeping, so marking a
 * feature built never makes its approved design look edited.
 */

const STATUS_LINE = /^- Status: \S+\s*$/;

export function isStatusLine(line: string): boolean {
  return STATUS_LINE.test(line);
}

export function sha256(text: string): string {
  return `sha256:${createHash("sha256").update(text).digest("hex")}`;
}

/** Hash of a document's design content, leaving out the `##` sections named. */
export function designHash(doc: MarkdownDoc, leftOut: readonly string[] = []): string {
  const skipped = leftOut.flatMap((title) => {
    const section = findSection(doc, title);
    return section === null ? [] : [[section.heading.line, section.end] as const];
  });
  const kept = doc.lines.filter((line, i) => !skipped.some(([start, end]) => i >= start && i < end) && (doc.inFence[i] || !isStatusLine(line)));
  return sha256(normalize(kept));
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
