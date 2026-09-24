import { removeRow, upsertRow } from "../edits/managed_tables.ts";
import { updateProgress } from "../edits/progress_block.ts";
import { parseMarkdown } from "../markdown.ts";
import { PATHS } from "../project/layout.ts";
import { readChangesTable } from "../project/plan_parts.ts";
import { readProgress } from "../project/progress.ts";
import type { ProjectView } from "../project/project_view.ts";
import type { WorkItem } from "../project/work_items.ts";

export interface Bookkeeping {
  /** Whether this land finishes the work: a standalone change, or a feature's last change. */
  finished: boolean;
  /** The folder to move into the archive when finished. */
  archive?: { from: string; to: string };
  release: string;
}

/** Records the land in progress blocks, the roadmap status and, when a feature finishes, the feature map. */
export function applyBookkeeping(view: ProjectView, change: WorkItem, source: WorkItem, landed: string, files: Map<string, string>): Bookkeeping {
  const text = (path: string): string | undefined => files.get(path) ?? view.snapshot.get(path);
  files.set(change.path, updateProgress(text(change.path) ?? "", (progress) => (progress.landed = landed)));

  let finished = true;
  if (source !== change) {
    const featureText = updateProgress(text(source.path) ?? "", (progress) => progress.changes.set(change.folderName, "landed"));
    files.set(source.path, featureText);
    const states = readProgress(parseMarkdown(featureText)).changes;
    finished = readChangesTable(source.doc).every((row) => states.get(row.change) === "landed");
  }

  const release = releaseName(text(PATHS.roadmap));
  const slug = typeof source.doc.frontmatter?.["roadmap"] === "string" ? source.doc.frontmatter["roadmap"] : undefined;
  const roadmap = text(PATHS.roadmap);
  if (slug !== undefined && roadmap !== undefined && roadmap.includes("## Status")) {
    files.set(PATHS.roadmap, upsertRow(roadmap, "Status", [slug, source.folderName, finished ? "landed" : "building"]));
  }
  const vision = text(PATHS.vision);
  if (finished && source.kind === "feature" && slug !== undefined && vision !== undefined && vision.includes("### Implemented")) {
    const { text: withoutFuture, removed } = removeRow(vision, "Future", slug);
    const summary = removed?.[1] ?? String(source.doc.frontmatter?.["title"] ?? slug);
    files.set(PATHS.vision, upsertRow(withoutFuture, "Implemented", [slug, release, summary]));
  }

  const result: Bookkeeping = { finished, release };
  if (finished) result.archive = { from: source.folder, to: `${PATHS.archiveDir}/${source.folderName}` };
  return result;
}

/** The release in progress: the roadmap's `## Release` line up to its colon. */
export function releaseName(roadmap: string | undefined): string {
  if (roadmap === undefined) return "unreleased";
  const line = roadmap.split("## Release")[1]?.split("\n").find((l) => l.trim() !== "");
  return line?.split(":")[0]?.trim() || "unreleased";
}
