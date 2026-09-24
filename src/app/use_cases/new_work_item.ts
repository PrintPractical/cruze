import { CruzeError } from "../../domain/cruze_error.ts";
import { upsertRow } from "../../domain/edits/managed_tables.ts";
import { resolveArtifact } from "../../domain/project/artifact_ref.ts";
import { PATHS } from "../../domain/project/layout.ts";
import { allocateId, changeRow, fillTemplate, isoDate, requireSlug } from "../../domain/project/new_items.ts";
import { renderTemplate } from "../../domain/scaffold.ts";
import { appendJournal, loadView, type ProjectDeps } from "../project_context.ts";

export type NewKind = "feature" | "change" | "adr";

export interface NewRequest {
  kind: NewKind;
  slug: string;
  title: string;
  /** For a change: the feature it belongs to. Without one, the change is standalone. */
  feature?: string;
  /** The roadmap item this feature or standalone change delivers; defaults to the slug. */
  roadmap?: string;
}

export interface NewReport {
  kind: "feature" | "change" | "standalone" | "adr";
  ref: string;
  path: string;
}

/** Creates a feature, change or ADR from its template, with a fresh ID. */
export async function createWorkItem(deps: ProjectDeps, request: NewRequest): Promise<NewReport> {
  const view = await loadView(deps.files);
  const date = isoDate(deps.clock.now());
  const values = { id: "", title: request.title, date, project_name: "" };
  if (request.title.trim() === "") throw new CruzeError("missing-title", "a title is required");

  if (request.kind === "adr") {
    requireSlug(request.slug);
    const path = `${PATHS.adrDir}/${date}-${request.slug}.md`;
    if (view.snapshot.has(path)) throw new CruzeError("exists", `${path} already exists`);
    const text = renderTemplate(await deps.bundle.formatTemplate("adr.md"), values).replace(/^# .*$/m, `# ${request.title}`);
    await deps.files.writeText(path, text);
    await appendJournal(deps, ".cruze", "new", { kind: "adr", ref: path });
    return { kind: "adr", ref: `ADR-${date}-${request.slug}`, path };
  }

  if (request.kind === "change" && request.feature !== undefined) {
    const { item: feature } = resolveArtifact(view, request.feature);
    if (feature === undefined || feature.kind !== "feature" || feature.archived) throw new CruzeError("not-a-feature", `"${request.feature}" is not an active feature`);
    const row = changeRow(view, feature, request.slug);
    const folder = `${feature.folder}/changes/${row.change}`;
    const template = renderTemplate(await deps.bundle.formatTemplate("change.md"), { ...values, id: row.change });
    await deps.files.writeText(`${folder}/change.md`, fillTemplate(template, { delivers: row.delivers, builds: [...row.builds, ...row.removes] }));
    await appendJournal(deps, feature.folder, "new", { kind: "change", ref: `${feature.ref}/${row.change}` });
    return { kind: "change", ref: `${feature.ref}/${row.change}`, path: `${folder}/change.md` };
  }

  const kind = request.kind === "feature" ? "feature" : "standalone";
  const id = allocateId(view, date, request.slug);
  const folder = `${kind === "feature" ? PATHS.featuresDir : PATHS.changesDir}/${id}`;
  const roadmap = request.roadmap ?? (roadmapHasItem(view.snapshot.get(PATHS.roadmap), request.slug) ? request.slug : undefined);
  const template = renderTemplate(await deps.bundle.formatTemplate(kind === "feature" ? "feature.md" : "standalone-change.md"), { ...values, id });
  const path = `${folder}/${kind === "feature" ? "feature.md" : "change.md"}`;
  await deps.files.writeText(path, fillTemplate(template, roadmap === undefined ? {} : { roadmap }));
  const roadmapText = view.snapshot.get(PATHS.roadmap);
  if (roadmap !== undefined && roadmapText !== undefined) {
    await deps.files.writeText(PATHS.roadmap, upsertRow(roadmapText, "Status", [roadmap, id, "designing"]));
  }
  await appendJournal(deps, folder, "new", { kind, ref: id });
  return { kind, ref: id, path };
}

/** Whether a roadmap phase lists this slug as an item. */
function roadmapHasItem(roadmap: string | undefined, slug: string): boolean {
  if (roadmap === undefined) return false;
  const phases = roadmap.split(/^## /m).find((section) => section.startsWith("Phases")) ?? "";
  return phases.split("\n").some((line) => line.startsWith(`| ${slug} |`));
}
