import { buildProjectView, type ProjectView } from "../domain/project/project_view.ts";
import { SNAPSHOT_ROOTS } from "../domain/project/layout.ts";
import { journalPath, serializeEntry, type JournalEntry } from "../domain/journal.ts";
import type { Bundle } from "./ports/bundle.ts";
import type { Clock } from "./ports/clock.ts";
import type { ProjectFiles } from "./ports/project_files.ts";
import type { Repository } from "./ports/repository.ts";

/** What the project use cases work with. */
export interface ProjectDeps {
  files: ProjectFiles;
  clock: Clock;
  repository: Repository;
  bundle: Bundle;
}

/** Reads every document under docs/ and .cruze/ into a view. */
export async function loadView(files: ProjectFiles): Promise<ProjectView> {
  const snapshot = new Map<string, string>();
  for (const root of SNAPSHOT_ROOTS) {
    for (const path of await files.listFiles(root)) {
      const text = await files.readText(path);
      if (text !== undefined) snapshot.set(path, text);
    }
  }
  return buildProjectView(snapshot);
}

/** A new view with some files replaced, for checking edits before writing them. */
export function withFiles(view: ProjectView, changes: Map<string, string>): ProjectView {
  return buildProjectView(new Map([...view.snapshot, ...changes]));
}

/** Appends an entry to the journal in `folder`, stamped with the time and the approver. */
export async function appendJournal(deps: ProjectDeps, folder: string, event: string, fields: Record<string, unknown>): Promise<JournalEntry> {
  const entry: JournalEntry = {
    at: deps.clock.now().toISOString(),
    event,
    by: (await deps.repository.userName()) ?? "unknown",
    cruze: deps.bundle.version,
    ...fields,
  };
  await deps.files.appendText(journalPath(folder), serializeEntry(entry));
  return entry;
}
