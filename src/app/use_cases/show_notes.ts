import { notesFor, readNotes, type Note, type NotesFor } from "../../domain/project/notes.ts";
import { loadView, type ProjectDeps } from "../project_context.ts";

/**
 * Every note with what it is about and the hand-off it holds, or, given a target such as
 * `project`, `architect` or a feature slug, the notes and hand-off rows for it.
 */
export async function showNotes(deps: ProjectDeps, target?: string): Promise<{ notes: Note[] } | (NotesFor & { target: string })> {
  const notes = readNotes((await loadView(deps.files)).snapshot);
  return target === undefined ? { notes } : { target, ...notesFor(notes, [target]) };
}
