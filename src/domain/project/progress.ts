import { MANAGED_CLOSE, MANAGED_OPEN, type MarkdownDoc } from "../markdown.ts";

/** The managed `## Progress` block of a feature or change. */
export interface Progress {
  branch?: string;
  /** Task number to the commit that completed it, or null while open. */
  tasks: Map<string, string | null>;
  deviations: string[];
  landed?: string;
  /** For a feature: each change's state line. */
  changes: Map<string, string>;
}

export function readProgress(doc: MarkdownDoc): Progress {
  const progress: Progress = { tasks: new Map(), deviations: [], changes: new Map() };
  const range = progressRange(doc);
  if (range === null) return progress;
  for (let i = range.start; i < range.end; i++) {
    const line = doc.lines[i] ?? "";
    let match = /^- Branch: (.+)$/.exec(line);
    if (match?.[1] !== undefined) progress.branch = match[1].trim();
    match = /^- \[([ x])\] (T\d+)(?: \(([0-9a-f]+)\))?/.exec(line);
    if (match?.[2] !== undefined) progress.tasks.set(match[2], match[1] === "x" ? (match[3] ?? "") : null);
    match = /^- Deviation (.+)$/.exec(line);
    if (match?.[1] !== undefined) progress.deviations.push(match[1]);
    match = /^- Landed: (.+)$/.exec(line);
    if (match?.[1] !== undefined) progress.landed = match[1];
    match = /^- (\d\d-[a-z0-9-]+): (.+)$/.exec(line);
    if (match?.[1] !== undefined && match[2] !== undefined) progress.changes.set(match[1], match[2]);
  }
  return progress;
}

/** Lines [start, end) inside the managed block that holds `## Progress`, or null. */
export function progressRange(doc: MarkdownDoc): { open: number; start: number; end: number } | null {
  const heading = doc.headings.find((h) => h.level === 2 && h.text === "Progress");
  if (heading === undefined || !doc.inManaged[heading.line]) return null;
  let open = heading.line;
  while (open > 0 && doc.lines[open]?.trim() !== MANAGED_OPEN) open--;
  let end = heading.line;
  while (end < doc.lines.length && doc.lines[end]?.trim() !== MANAGED_CLOSE) end++;
  return { open, start: heading.line + 1, end };
}
