import { parseMarkdown } from "../markdown.ts";
import { splitRow, tablesIn } from "../markdown_tables.ts";

/**
 * Edits to the managed tables: the feature map in vision.md and the status table
 * in roadmap.md. Rows are keyed by their first cell.
 */

/** Replaces or appends the row keyed by `cells[0]` in the table under a heading. */
export function upsertRow(text: string, heading: string, cells: string[]): string {
  return editTable(text, heading, (rows) => {
    const index = rows.findIndex((row) => row[0] === cells[0]);
    if (index === -1) rows.push(cells);
    else rows[index] = cells;
  });
}

export function removeRow(text: string, heading: string, key: string): { text: string; removed: string[] | null } {
  let removed: string[] | null = null;
  const next = editTable(text, heading, (rows) => {
    const index = rows.findIndex((row) => row[0] === key);
    if (index !== -1) removed = rows.splice(index, 1)[0] ?? null;
  });
  return { text: next, removed };
}

export function readRows(text: string, heading: string): string[][] {
  const doc = parseMarkdown(text);
  const at = doc.headings.find((h) => h.text === heading);
  if (at === undefined) return [];
  const end = doc.headings.find((h) => h.line > at.line && h.level <= at.level)?.line ?? doc.lines.length;
  return tablesIn(doc.lines, doc.inFence, at.line + 1, end)[0]?.rows.map((row) => row.cells) ?? [];
}

function editTable(text: string, heading: string, edit: (rows: string[][]) => void): string {
  const doc = parseMarkdown(text);
  const at = doc.headings.find((h) => h.text === heading);
  if (at === undefined) throw new Error(`No "${heading}" heading to edit`);
  const end = doc.headings.find((h) => h.line > at.line && h.level <= at.level)?.line ?? doc.lines.length;
  let first = -1;
  let last = -1;
  for (let i = at.line + 1; i < end; i++) {
    if (/^\s*\|.*\|\s*$/.test(doc.lines[i] ?? "")) {
      if (first === -1) first = i;
      last = i;
    } else if (first !== -1) break;
  }
  if (first === -1) throw new Error(`No table under "${heading}"`);
  const header = splitRow(doc.lines[first] ?? "");
  const rows = doc.lines.slice(first + 2, last + 1).map(splitRow);
  edit(rows);
  const rendered = [renderRow(header), renderRow(header.map(() => "---")), ...rows.map(renderRow)];
  const lines = [...doc.lines];
  lines.splice(first, last - first + 1, ...rendered);
  return lines.join("\n");
}

function renderRow(cells: string[]): string {
  return `| ${cells.join(" | ")} |`;
}
