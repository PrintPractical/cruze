import { CruzeError } from "../../domain/cruze_error.ts";
import { PATHS } from "../../domain/project/layout.ts";
import { NOTE_KINDS } from "../../domain/project/notes.ts";
import { requireSlug } from "../../domain/project/new_items.ts";
import { renderTemplate } from "../../domain/scaffold.ts";
import { appendJournal, loadView, type ProjectDeps } from "../project_context.ts";

export type ProjectDocKind = "vision" | "glossary" | "architecture" | "roadmap";

export const PROJECT_DOC_KINDS: readonly ProjectDocKind[] = ["vision", "glossary", "architecture", "roadmap"];

export interface NewDocReport {
  kind: ProjectDocKind | "note";
  path: string;
}

/** Creates one of the project's living documents from its template, named for the project. */
export async function createProjectDoc(deps: ProjectDeps, kind: ProjectDocKind): Promise<NewDocReport> {
  const view = await loadView(deps.files);
  const path = PATHS[kind];
  if (view.snapshot.has(path)) throw new CruzeError("exists", `${path} already exists`);
  const project = view.config?.config?.project ?? "";
  if (project === "") throw new CruzeError("no-config", `${PATHS.config} is missing or has no project name; run cruze init first`);
  const values = { project_name: project, id: "", title: "", date: deps.clock.today() };
  await deps.files.writeText(path, renderTemplate(await deps.bundle.formatTemplate(`${kind}.md`), values));
  await appendJournal(deps, ".cruze", "new", { kind, ref: path });
  return { kind, path };
}

/** Creates a dated note in `.cruze/notes/`, such as a captured explore session or research evidence. */
/**
 * A dated note, saying what kind it is and what it is about, so `cruze show` finds it for the work it
 * informs: `project`, feature slugs, or context and capability names.
 */
export async function createNote(deps: ProjectDeps, slug: string, title: string, kind: string, about: string): Promise<NewDocReport> {
  requireSlug(slug);
  if (title.trim() === "") throw new CruzeError("missing-title", "a title is required");
  if (!(NOTE_KINDS as readonly string[]).includes(kind)) throw new CruzeError("note-kind", `a note's kind is one of ${NOTE_KINDS.join(", ")}`);
  const subjects = about.split(",").map((a) => a.trim()).filter((a) => a !== "");
  if (subjects.length === 0) throw new CruzeError("note-about", "name what the note is about: project, feature slugs, or contexts, comma-separated");
  const view = await loadView(deps.files);
  const date = deps.clock.today();
  const base = `${PATHS.notesDir}/${date}-${slug}`;
  let path = `${base}.md`;
  for (let n = 2; view.snapshot.has(path); n++) path = `${base}-${n}.md`;
  await deps.files.writeText(path, `# ${title}\n\n- Date: ${date}\n- Kind: ${kind}\n- About: ${subjects.join(", ")}\n\n`);
  return { kind: "note", path };
}
