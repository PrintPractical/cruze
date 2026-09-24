import { ID_PATTERN, kindOf, type Kind } from "./ids.ts";
import { sectionEnd, type MarkdownDoc } from "./markdown.ts";

export type DeltaOp = "ADDED" | "MODIFIED" | "REMOVED";
export type Status = "planned" | "built";

/** One element: a heading `<ID>: <Title>` and its body, or a table row whose first cell is an ID. */
export interface Element {
  id: string;
  kind: Kind;
  title: string;
  form: "heading" | "row";
  /** Set when the heading is a delta operation, such as `### ADDED PORT-x: Title`. */
  op?: DeltaOp;
  level: number;
  /** Line range [start, end) in the document. */
  start: number;
  end: number;
}

/** A delta heading that creates a spec file: `### ADDED CAPABILITY <name>: <Title>`. */
export interface CapabilityOp {
  capability: string;
  title: string;
  start: number;
  end: number;
}

const HEADING = new RegExp(`^(?:(ADDED|MODIFIED|REMOVED) )?(${ID_PATTERN}): (.+)$`);
const CAPABILITY = /^ADDED CAPABILITY ([a-z0-9]+(?:-[a-z0-9]+)*): (.+)$/;
const ROW = new RegExp(`^\\|\\s*(${ID_PATTERN})\\s*\\|(.*)\\|\\s*$`);
const STATUS_LINE = /^- Status: (planned|built)\s*$/;

/** Heading elements whose heading lies in [from, to). */
export function headingElements(doc: MarkdownDoc, from = 0, to = doc.lines.length): Element[] {
  const elements: Element[] = [];
  for (const heading of doc.headings) {
    if (heading.line < from || heading.line >= to) continue;
    const match = HEADING.exec(heading.text);
    if (match?.[2] === undefined || match[3] === undefined) continue;
    const element: Element = {
      id: match[2],
      kind: kindOf(match[2]),
      title: match[3],
      form: "heading",
      level: heading.level,
      start: heading.line,
      end: Math.min(sectionEnd(doc, heading), to),
    };
    if (match[1] !== undefined) element.op = match[1] as DeltaOp;
    elements.push(element);
  }
  return elements;
}

export function capabilityOps(doc: MarkdownDoc, from = 0, to = doc.lines.length): CapabilityOp[] {
  return doc.headings
    .filter((h) => h.line >= from && h.line < to)
    .flatMap((heading) => {
      const match = CAPABILITY.exec(heading.text);
      if (match?.[1] === undefined || match[2] === undefined) return [];
      return [{ capability: match[1], title: match[2], start: heading.line, end: Math.min(sectionEnd(doc, heading), to) }];
    });
}

/** Row elements: table rows, outside code fences, whose first cell is an ID. */
export function rowElements(doc: MarkdownDoc): Element[] {
  return doc.lines.flatMap((line, index) => {
    if (doc.inFence[index]) return [];
    const match = ROW.exec(line);
    if (match?.[1] === undefined) return [];
    const title = match[2]?.split("|")[0]?.trim() ?? "";
    return [{ id: match[1], kind: kindOf(match[1]), title, form: "row" as const, level: 0, start: index, end: index + 1 }];
  });
}

export function elementLines(doc: MarkdownDoc, element: { start: number; end: number }): string[] {
  return doc.lines.slice(element.start, element.end);
}

export function isStatusLine(line: string): boolean {
  return STATUS_LINE.test(line);
}

/** The element's own managed status: the first status line before any nested heading. */
export function statusOf(doc: MarkdownDoc, element: Element): Status | undefined {
  for (let i = element.start + 1; i < element.end; i++) {
    if (/^#{1,6} /.test(doc.lines[i] ?? "") && !doc.inFence[i]) return undefined;
    const match = STATUS_LINE.exec(doc.lines[i] ?? "");
    if (match?.[1] !== undefined) return match[1] as Status;
  }
  return undefined;
}

/**
 * The element's top-level facts: `- Key: value` items and their indented sub-items.
 * Nested elements' facts are excluded.
 */
export function factsOf(doc: MarkdownDoc, element: Element): Map<string, string[]> {
  const facts = new Map<string, string[]>();
  let current: string[] | null = null;
  for (let i = element.start + 1; i < element.end; i++) {
    const line = doc.lines[i] ?? "";
    if (doc.inFence[i]) continue;
    if (/^#{1,6} /.test(line)) break;
    const fact = /^- ([A-Z][A-Za-z ]*): ?(.*)$/.exec(line);
    if (fact?.[1] !== undefined) {
      current = fact[2] === undefined || fact[2] === "" ? [] : [fact[2]];
      facts.set(fact[1], current);
      continue;
    }
    const sub = /^\s{2,}- (.+)$/.exec(line);
    if (sub?.[1] !== undefined && current !== null) current.push(sub[1]);
    else if (line.trim() !== "") current = null;
  }
  return facts;
}
