import { findSection, parseMarkdown } from "../markdown.ts";
import { tablesIn } from "../markdown_tables.ts";
import { PATHS } from "./layout.ts";
import type { Snapshot } from "./layout.ts";

/**
 * Notes under `.cruze/notes/`: what the user brought, what explore captured, the evidence research
 * gathered, and the hand-off envision wrote from them. Each says what it is about, so a step reads
 * the notes for its work rather than guessing from file names: one project held 21 notes, and a
 * 9,500-word seed whose design sections no step was told to read.
 */

export const NOTE_KINDS = ["input", "intake", "explore", "research"] as const;
export type NoteKind = (typeof NOTE_KINDS)[number];

/** The step an intake row hands a part to, besides a feature on the map. */
export const HANDOFF_STEPS = ["vision", "architect", "roadmap", "user"] as const;

export interface HandoffRow {
  /** The part of the input, by its heading or a short quote. */
  part: string;
  /** Where it is: a note path and heading, or "below" for text saved in the intake note. */
  source: string;
  /** A step from HANDOFF_STEPS, or the slug of the feature that takes it up. */
  goesTo: string;
  /** `open` until the step that takes it up settles it with the user: `settled` or `dropped`. */
  status: string;
}

export interface Note {
  path: string;
  title: string;
  kind?: string;
  /** `project`, feature slugs, or context and capability names. */
  about: string[];
  handoff: HandoffRow[];
}

export function readNotes(snapshot: Snapshot): Note[] {
  return [...snapshot.keys()]
    .filter((path) => path.startsWith(`${PATHS.notesDir}/`) && path.endsWith(".md"))
    .sort()
    .map((path) => readNote(path, snapshot.get(path) ?? ""));
}

function readNote(path: string, text: string): Note {
  const doc = parseMarkdown(text);
  const title = doc.headings.find((h) => h.level === 1)?.text ?? path.slice(path.lastIndexOf("/") + 1, -".md".length);
  const firstSection = doc.headings.find((h) => h.level === 2)?.line ?? doc.lines.length;
  const fact = (key: string): string | undefined =>
    doc.lines.slice(0, firstSection).map((line) => new RegExp(`^- ${key}: (.+)$`).exec(line)?.[1]?.trim()).find((v) => v !== undefined);
  const about = (fact("About") ?? "").split(",").map((a) => a.trim()).filter((a) => a !== "");
  const kind = fact("Kind");
  const section = findSection(doc, "Hand-off");
  const rows = section === null ? [] : (tablesIn(doc.lines, doc.inFence, section.start, section.end)[0]?.rows ?? []);
  const handoff = rows.map(({ cells }) => ({ part: cells[0] ?? "", source: cells[1] ?? "", goesTo: (cells[2] ?? "").replace(/`/g, ""), status: cells[3] ?? "open" }));
  return { path, title, about, handoff, ...(kind === undefined ? {} : { kind }) };
}

export interface NotesFor {
  /** Notes about one of the targets, or about the whole project when it is a target. */
  notes: Note[];
  /** Intake rows handed to one of the targets, with the intake note that holds them. */
  handoffs: Array<HandoffRow & { note: string }>;
}

/** The notes and hand-off rows for a piece of work, named by its targets: `project`, a step, a feature slug or a context. */
export function notesFor(notes: Note[], targets: string[]): NotesFor {
  const wanted = new Set(targets);
  return {
    notes: notes.filter((note) => note.about.some((a) => wanted.has(a))),
    handoffs: notes.flatMap((note) => note.handoff.filter((row) => wanted.has(row.goesTo)).map((row) => ({ ...row, note: note.path }))),
  };
}
