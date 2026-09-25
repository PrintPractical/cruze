import { CruzeError } from "../../domain/cruze_error.ts";
import { readRows, upsertRow } from "../../domain/edits/managed_tables.ts";
import { resolveArtifact } from "../../domain/project/artifact_ref.ts";
import { PATHS } from "../../domain/project/layout.ts";
import { appendJournal, loadView, type ProjectDeps } from "../project_context.ts";

export interface AbandonReport {
  ref: string;
  archivedTo: string;
  /** The feature-map slug it went back to, for a feature that may return. */
  futureList?: string;
}

/**
 * Stops a feature or standalone change for good: archives its folder with the reason, marks it
 * abandoned on the roadmap, and puts a feature back on the future list. Changes that already
 * landed stay in the living docs.
 */
export async function abandonWork(deps: ProjectDeps, ref: string, reason: string): Promise<AbandonReport> {
  if (reason.trim() === "") throw new CruzeError("missing-reason", "abandoning work needs a reason");
  const view = await loadView(deps.files);
  const { item } = resolveArtifact(view, ref);
  if (item === undefined || item.archived) throw new CruzeError("not-found", `"${ref}" is not an active feature or standalone change`);
  if (item.kind === "change") throw new CruzeError("not-abandonable", `${item.ref} belongs to a feature; remove it from the feature's Changes table through rethink instead`);

  const slug = typeof item.doc.frontmatter?.["roadmap"] === "string" ? item.doc.frontmatter["roadmap"] : undefined;
  const roadmap = view.snapshot.get(PATHS.roadmap);
  if (slug !== undefined && roadmap !== undefined && roadmap.includes("## Status")) {
    await deps.files.writeText(PATHS.roadmap, upsertRow(roadmap, "Status", [slug, item.folderName, "abandoned"]));
  }
  const report: AbandonReport = { ref: item.ref, archivedTo: `${PATHS.archiveDir}/${item.folderName}` };
  const vision = view.snapshot.get(PATHS.vision);
  if (item.kind === "feature" && slug !== undefined && vision !== undefined && vision.includes("### Future")) {
    if (!readRows(vision, "Future").some((row) => row[0] === slug)) {
      await deps.files.writeText(PATHS.vision, upsertRow(vision, "Future", [slug, String(item.doc.frontmatter?.["title"] ?? slug), ""]));
    }
    report.futureList = slug;
  }
  await appendJournal(deps, item.folder, "abandon", { item: item.ref, reason: reason.trim() });
  await deps.files.move(item.folder, report.archivedTo);
  return report;
}
