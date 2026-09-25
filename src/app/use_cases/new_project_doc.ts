import { CruzeError } from "../../domain/cruze_error.ts";
import { PATHS } from "../../domain/project/layout.ts";
import { isoDate, requireSlug } from "../../domain/project/new_items.ts";
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
  const values = { project_name: project, id: "", title: "", date: isoDate(deps.clock.now()) };
  await deps.files.writeText(path, renderTemplate(await deps.bundle.formatTemplate(`${kind}.md`), values));
  await appendJournal(deps, ".cruze", "new", { kind, ref: path });
  return { kind, path };
}

/** Creates a dated note in `.cruze/notes/`, such as a captured explore session or research evidence. */
export async function createNote(deps: ProjectDeps, slug: string, title: string): Promise<NewDocReport> {
  requireSlug(slug);
  if (title.trim() === "") throw new CruzeError("missing-title", "a title is required");
  const view = await loadView(deps.files);
  const date = isoDate(deps.clock.now());
  const base = `${PATHS.notesDir}/${date}-${slug}`;
  let path = `${base}.md`;
  for (let n = 2; view.snapshot.has(path); n++) path = `${base}-${n}.md`;
  await deps.files.writeText(path, `# ${title}\n\n- Date: ${date}\n\n`);
  return { kind: "note", path };
}
