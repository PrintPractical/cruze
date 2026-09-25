import { findIds } from "../ids.ts";
import { findSection, type MarkdownDoc } from "../markdown.ts";
import { tablesIn } from "../markdown_tables.ts";

/** The parts of feature.md and change.md that describe what gets built and how it is proved. */

export interface Scope {
  delivers: string[];
  builds: string[];
  removes: string[];
  line: number;
}

export interface Task {
  number: string;
  owner: string;
  paths: string[];
  proves: string[];
  line: number;
}

export interface TestPlanRow {
  subject: string;
  seam: string;
  file: string;
  kind: string;
  line: number;
}

export interface ChangeRow {
  change: string;
  delivers: string[];
  builds: string[];
  removes: string[];
  dependsOn: string[];
  line: number;
}

const TASK = /^- (T\d+): `([^`]+)`[^`]*? in ((?:`[^`]+`(?:, )?)+), proves (.+)$/;

export function readScope(doc: MarkdownDoc): Scope | null {
  const section = findSection(doc, "Scope");
  if (section === null) return null;
  const scope: Scope = { delivers: [], builds: [], removes: [], line: section.heading.line };
  for (let i = section.start; i < section.end; i++) {
    const match = /^- (Delivers|Builds|Removes): (.*)$/.exec(doc.lines[i] ?? "");
    if (match?.[1] === undefined || match[2] === undefined) continue;
    const key = match[1].toLowerCase() as "delivers" | "builds" | "removes";
    scope[key] = findIds(match[2]);
  }
  return scope;
}

/** Task lines, and the lines under `## Tasks` that don't parse as tasks. */
export function readTasks(doc: MarkdownDoc): { tasks: Task[]; malformed: number[] } {
  const section = findSection(doc, "Tasks");
  const tasks: Task[] = [];
  const malformed: number[] = [];
  if (section === null) return { tasks, malformed };
  for (let i = section.start; i < section.end; i++) {
    const line = doc.lines[i] ?? "";
    if (!line.startsWith("- ")) continue;
    const match = TASK.exec(line);
    if (match?.[1] === undefined || match[2] === undefined || match[3] === undefined || match[4] === undefined) {
      malformed.push(i);
      continue;
    }
    const paths = [...match[3].matchAll(/`([^`]+)`/g)].map((m) => m[1] ?? "");
    tasks.push({ number: match[1], owner: match[2], paths, proves: findIds(match[4]), line: i });
  }
  return { tasks, malformed };
}

/**
 * Whether a change has been planned. A standalone change is designed first, with an
 * empty test plan and no tasks; plan fills both.
 */
export function isPlanned(doc: MarkdownDoc): boolean {
  const { tasks, malformed } = readTasks(doc);
  return readTestPlan(doc).length > 0 || tasks.length > 0 || malformed.length > 0;
}

export function readTestPlan(doc: MarkdownDoc): TestPlanRow[] {
  const section = findSection(doc, "Test plan");
  if (section === null) return [];
  const table = tablesIn(doc.lines, doc.inFence, section.start, section.end)[0];
  return (table?.rows ?? []).map(({ cells, line }) => ({
    subject: cells[0] ?? "",
    seam: cells[1] ?? "",
    file: (cells[2] ?? "").replace(/`/g, ""),
    kind: cells[3] ?? "",
    line,
  }));
}

export function readChangesTable(doc: MarkdownDoc): ChangeRow[] {
  const section = findSection(doc, "Changes");
  if (section === null) return [];
  const table = tablesIn(doc.lines, doc.inFence, section.start, section.end)[0];
  if (table === undefined) return [];
  const column = (name: string): number => table.header.findIndex((cell) => cell.toLowerCase() === name);
  const cell = (cells: string[], name: string): string => cells[column(name)] ?? "";
  return table.rows.map(({ cells, line }) => ({
    change: cells[0] ?? "",
    delivers: findIds(cell(cells, "delivers")),
    builds: findIds(cell(cells, "builds")),
    removes: findIds(cell(cells, "removes")),
    dependsOn: cell(cells, "depends on").split(",").map((s) => s.trim()).filter((s) => s !== ""),
    line,
  }));
}
