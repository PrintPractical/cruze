import { CruzeError } from "../../domain/cruze_error.ts";
import { readRows, removeRow, upsertRow } from "../../domain/edits/managed_tables.ts";
import { updateProgress } from "../../domain/edits/progress_block.ts";
import { resolveChange } from "../../domain/project/artifact_ref.ts";
import { PATHS } from "../../domain/project/layout.ts";
import { readTasks } from "../../domain/project/plan_parts.ts";
import { requireSlug } from "../../domain/project/new_items.ts";
import { activeChange } from "../../domain/status/work_status.ts";
import type { WorkItem } from "../../domain/project/work_items.ts";
import { appendJournal, loadView, type ProjectDeps } from "../project_context.ts";

/** Commands that write the CLI-owned progress records: task ticks, deviations and the feature map. */

export interface TaskReport {
  change: string;
  task: string;
  done: number;
  total: number;
}

/** Marks a task done, recording the commit that completed it (HEAD by default). */
export async function completeTask(deps: ProjectDeps, task: string, options: { change?: string; commit?: string }): Promise<TaskReport> {
  const change = await changeFor(deps, options.change);
  requireTask(change, task);
  const commit = options.commit ?? (await deps.repository.headCommit()) ?? "";
  const text = updateProgress(change.doc.lines.join("\n"), (progress) => progress.tasks.set(task, commit));
  await deps.files.writeText(change.path, text);
  const ticks = [...text.matchAll(/^- \[([ x])\] T\d+/gm)];
  return { change: change.ref, task, done: ticks.filter((m) => m[1] === "x").length, total: ticks.length };
}

/** Reopens a done task whose design a rethink changed, so build does it again. */
export async function reopenTask(deps: ProjectDeps, task: string, reason: string, options: { change?: string }): Promise<{ change: string; task: string }> {
  const change = await changeFor(deps, options.change);
  requireTask(change, task);
  if (reason.trim() === "") throw new CruzeError("missing-reason", "say why the task reopens");
  await deps.files.writeText(change.path, updateProgress(change.doc.lines.join("\n"), (progress) => progress.tasks.set(task, null)));
  await appendJournal(deps, change.folder, "reopen", { change: change.ref, task, reason: reason.trim() });
  return { change: change.ref, task };
}

/** Records a task-level choice the agent made on its own. Anything larger is a rethink. */
export async function recordDeviation(deps: ProjectDeps, task: string, text: string, options: { change?: string }): Promise<{ change: string; task: string }> {
  const change = await changeFor(deps, options.change);
  requireTask(change, task);
  if (text.trim() === "") throw new CruzeError("missing-text", "describe the deviation");
  await deps.files.writeText(change.path, updateProgress(change.doc.lines.join("\n"), (progress) => progress.deviations.push(`${task}: ${text.trim()}`)));
  await appendJournal(deps, change.folder, "deviation", { change: change.ref, task, text: text.trim() });
  return { change: change.ref, task };
}

/** Adds a feature to the future list of the feature map, or replaces its entry. */
export async function addFutureFeature(deps: ProjectDeps, slug: string, summary: string, goals: string[]): Promise<{ feature: string }> {
  requireSlug(slug);
  const vision = await requireVision(deps);
  await deps.files.writeText(PATHS.vision, upsertRow(vision, "Future", [slug, summary, goals.join(", ")]));
  await appendJournal(deps, ".cruze", "feature-map", { action: "add", feature: slug, summary, goals });
  return { feature: slug };
}

export async function dropFutureFeature(deps: ProjectDeps, slug: string, reason: string): Promise<{ feature: string }> {
  const vision = await requireVision(deps);
  const { text, removed } = removeRow(vision, "Future", slug);
  if (removed === null) throw new CruzeError("not-found", `${slug} is not on the future list`);
  if (reason.trim() === "") throw new CruzeError("missing-reason", "dropping a feature needs a reason");
  await deps.files.writeText(PATHS.vision, text);
  await appendJournal(deps, ".cruze", "feature-map", { action: "drop", feature: slug, reason });
  return { feature: slug };
}

/** Clears the landed rows from the roadmap's Status table, when a release closes. */
export async function pruneRoadmap(deps: ProjectDeps): Promise<{ removed: string[] }> {
  const roadmap = await deps.files.readText(PATHS.roadmap);
  if (roadmap === undefined) throw new CruzeError("not-found", `${PATHS.roadmap} does not exist yet`);
  const landed = readRows(roadmap, "Status").filter((row) => row[2] === "landed").map((row) => row[0] ?? "");
  let text = roadmap;
  for (const item of landed) text = removeRow(text, "Status", item).text;
  if (landed.length > 0) {
    await deps.files.writeText(PATHS.roadmap, text);
    await appendJournal(deps, ".cruze", "roadmap-prune", { items: landed });
  }
  return { removed: landed };
}

async function changeFor(deps: ProjectDeps, ref: string | undefined): Promise<WorkItem> {
  const view = await loadView(deps.files);
  if (ref !== undefined) return resolveChange(view, ref);
  const change = activeChange(view, await deps.repository.currentBranch());
  if (change === undefined) throw new CruzeError("no-active-change", "no change is bound to this branch; name one with --change");
  return change;
}

function requireTask(change: WorkItem, task: string): void {
  if (!readTasks(change.doc).tasks.some((t) => t.number === task)) throw new CruzeError("unknown-task", `${change.ref} has no task ${task}`);
}

async function requireVision(deps: ProjectDeps): Promise<string> {
  const vision = await deps.files.readText(PATHS.vision);
  if (vision === undefined) throw new CruzeError("not-found", `${PATHS.vision} does not exist yet`);
  return vision;
}
