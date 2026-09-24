import { headingElements, isStatusLine, statusOf, type Status } from "../elements.ts";
import { STATUS_KINDS } from "../ids.ts";
import { parseMarkdown, type MarkdownDoc } from "../markdown.ts";

/** Managed `- Status:` lines: only the CLI adds or changes them. */

/** Sets one element's status, adding the line after its facts when it has none. Returns the new text. */
export function setStatus(text: string, id: string, status: Status): string {
  const doc = parseMarkdown(text);
  const element = headingElements(doc).find((e) => e.id === id);
  if (element === undefined) throw new Error(`${id} is not in this document`);
  const lines = [...doc.lines];
  const at = statusLineIndex(doc, element.start, element.end);
  if (at !== null) lines[at] = `- Status: ${status}`;
  else lines.splice(insertionPoint(doc, element.start, element.end), 0, `- Status: ${status}`);
  return lines.join("\n");
}

/** Adds `- Status: planned` to every status-carrying element that has none. */
export function stampMissingStatuses(text: string): { text: string; stamped: string[] } {
  let current = text;
  const stamped: string[] = [];
  for (const element of headingElements(parseMarkdown(text))) {
    if (!STATUS_KINDS.includes(element.kind)) continue;
    const doc = parseMarkdown(current);
    const fresh = headingElements(doc).find((e) => e.id === element.id);
    if (fresh === undefined || statusOf(doc, fresh) !== undefined) continue;
    current = setStatus(current, element.id, "planned");
    stamped.push(element.id);
  }
  return { text: current, stamped };
}

function statusLineIndex(doc: MarkdownDoc, start: number, end: number): number | null {
  for (let i = start + 1; i < end; i++) {
    if (!doc.inFence[i] && /^#{1,6} /.test(doc.lines[i] ?? "")) return null;
    if (!doc.inFence[i] && isStatusLine(doc.lines[i] ?? "")) return i;
  }
  return null;
}

/** After the element's last top-level fact or step, before any diagram or nested heading. */
function insertionPoint(doc: MarkdownDoc, start: number, end: number): number {
  let point = start + 1;
  for (let i = start + 1; i < end; i++) {
    const line = doc.lines[i] ?? "";
    if (doc.inFence[i] || /^#{1,6} /.test(line)) break;
    if (/^(- |\s{2,}- )/.test(line)) point = i + 1;
    else if (line.trim() !== "" && point > start + 1) break;
  }
  return point;
}
