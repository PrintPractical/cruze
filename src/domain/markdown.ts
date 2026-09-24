import { parse as parseYaml } from "yaml";

/** A Markdown document split into lines, with the structure Cruze relies on. */
export interface MarkdownDoc {
  lines: string[];
  frontmatter: Record<string, unknown> | null;
  /** First line after the frontmatter. */
  bodyStart: number;
  headings: Heading[];
  /** True for lines inside a fenced code block, fences included. */
  inFence: boolean[];
  /** True for lines inside a managed block, markers included. */
  inManaged: boolean[];
}

export interface Heading {
  level: number;
  text: string;
  line: number;
}

export const MANAGED_OPEN = "<!-- cruze:managed -->";
export const MANAGED_CLOSE = "<!-- /cruze:managed -->";

export function parseMarkdown(text: string): MarkdownDoc {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const { frontmatter, bodyStart } = readFrontmatter(lines);
  const inFence: boolean[] = [];
  const inManaged: boolean[] = [];
  const headings: Heading[] = [];
  let fence: string | null = null;
  let managed = false;

  lines.forEach((line, index) => {
    const fenceMatch = /^(```|~~~)/.exec(line.trimStart());
    if (fence === null && fenceMatch?.[1] !== undefined && index >= bodyStart) {
      fence = fenceMatch[1];
      inFence.push(true);
    } else if (fence !== null) {
      inFence.push(true);
      if (line.trimStart().startsWith(fence)) fence = null;
    } else {
      inFence.push(false);
    }

    const trimmed = line.trim();
    if (!inFence[index] && trimmed === MANAGED_OPEN) managed = true;
    inManaged.push(managed);
    if (!inFence[index] && trimmed === MANAGED_CLOSE) managed = false;

    const heading = /^(#{1,6}) (.+?)\s*$/.exec(line);
    if (heading?.[1] !== undefined && heading[2] !== undefined && !inFence[index] && index >= bodyStart) {
      headings.push({ level: heading[1].length, text: heading[2], line: index });
    }
  });
  return { lines, frontmatter, bodyStart, headings, inFence, inManaged };
}

/** The line range [start, end) of a heading's section: up to the next heading at the same or a higher level. */
export function sectionEnd(doc: MarkdownDoc, heading: Heading): number {
  const next = doc.headings.find((h) => h.line > heading.line && h.level <= heading.level);
  return next === undefined ? doc.lines.length : next.line;
}

/** The body lines of the first `##` section with this title, or null when absent. */
export function findSection(doc: MarkdownDoc, title: string, level = 2): { heading: Heading; start: number; end: number } | null {
  const heading = doc.headings.find((h) => h.level === level && h.text === title);
  if (heading === undefined) return null;
  return { heading, start: heading.line + 1, end: sectionEnd(doc, heading) };
}

function readFrontmatter(lines: string[]): { frontmatter: Record<string, unknown> | null; bodyStart: number } {
  if (lines[0] !== "---") return { frontmatter: null, bodyStart: 0 };
  const end = lines.indexOf("---", 1);
  if (end === -1) return { frontmatter: null, bodyStart: 0 };
  const parsed: unknown = parseYaml(lines.slice(1, end).join("\n"));
  const frontmatter = parsed !== null && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};
  return { frontmatter, bodyStart: end + 1 };
}
