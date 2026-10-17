import { CruzeError } from "../../domain/cruze_error.ts";
import { isSlug } from "../../domain/ids.ts";
import { PATHS, featurePath } from "../../domain/project/layout.ts";
import { renderTemplate } from "../../domain/scaffold.ts";
import { loadDocs, requireConfig, type ProjectDeps } from "../project_context.ts";

export const DOCUMENT_KINDS = ["vision", "architecture", "feature"] as const;
export type DocumentKind = (typeof DOCUMENT_KINDS)[number];

export interface NewDocReport {
  kind: DocumentKind;
  path: string;
}

/** Creates the vision, the architecture map or a feature from its template. A feature needs a slug, and a title defaults to it. */
export async function createDocument(deps: ProjectDeps, kind: DocumentKind, slug?: string, title?: string): Promise<NewDocReport> {
  const docs = await loadDocs(deps.files);
  const project = requireConfig(docs).project;
  if (kind === "feature" && (slug === undefined || !isSlug(slug))) throw new CruzeError("invalid-slug", `a feature needs a slug of lowercase words joined by single hyphens, such as "sign-in"`);
  const path = kind === "feature" ? featurePath(slug ?? "") : PATHS[kind];
  if (docs.snapshot.has(path)) throw new CruzeError("exists", `${path} already exists`);
  const values = { project_name: project, slug: slug ?? "", title: title ?? slug ?? "" };
  await deps.files.writeText(path, renderTemplate(await deps.bundle.formatTemplate(`${kind}.md`), values));
  return { kind, path };
}
