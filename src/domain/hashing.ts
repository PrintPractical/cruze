import { createHash } from "node:crypto";
import type { MarkdownDoc } from "./markdown.ts";

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

/** Hash of a whole document's design content. */
export function designHash(doc: MarkdownDoc): string {
  const kept = doc.lines.filter((line, i) => doc.inFence[i] || !isStatusLine(line));
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
