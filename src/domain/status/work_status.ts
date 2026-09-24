import { evaluateApproval, type ApprovalStatus } from "../approvals/evaluate.ts";
import { findIds } from "../ids.ts";
import { PATHS } from "../project/layout.ts";
import { readDelta } from "../project/deltas.ts";
import { readScope } from "../project/plan_parts.ts";
import { readProgress } from "../project/progress.ts";
import type { ProjectView } from "../project/project_view.ts";
import { changesOf, featureOf, type WorkItem } from "../project/work_items.ts";

export interface ChangeStatus {
  ref: string;
  path: string;
  approval: ApprovalStatus;
  branch?: string;
  tasksDone: number;
  tasksTotal: number;
  /** When and in which commit the change landed, once it has. */
  landed?: string;
}

export interface FeatureStatus {
  ref: string;
  path: string;
  approval: ApprovalStatus;
  changes: ChangeStatus[];
}

export interface ProjectStatus {
  documents: ApprovalStatus[];
  features: FeatureStatus[];
  standalone: ChangeStatus[];
  /** The change bound to the current branch, if any. */
  active?: string;
}

export function projectStatus(view: ProjectView, branch: string | null): ProjectStatus {
  const documents = [PATHS.vision, PATHS.architecture, PATHS.roadmap].filter((p) => view.snapshot.has(p)).map((p) => evaluateApproval(view, p));
  const active = view.items.filter((item) => !item.archived);
  const features = active
    .filter((item) => item.kind === "feature")
    .map((feature) => ({
      ref: feature.ref,
      path: feature.path,
      approval: evaluateApproval(view, feature.path),
      changes: changesOf(view.items, feature).map((change) => changeStatus(view, change)),
    }));
  const standalone = active.filter((item) => item.kind === "standalone").map((change) => changeStatus(view, change));
  const status: ProjectStatus = { documents, features, standalone };
  const bound = activeChange(view, branch);
  if (bound !== undefined) status.active = bound.ref;
  return status;
}

export function activeChange(view: ProjectView, branch: string | null): WorkItem | undefined {
  if (branch === null) return undefined;
  return view.items.find((item) => !item.archived && item.kind !== "feature" && readProgress(item.doc).branch === branch);
}

function changeStatus(view: ProjectView, change: WorkItem): ChangeStatus {
  const progress = readProgress(change.doc);
  const status: ChangeStatus = {
    ref: change.ref,
    path: change.path,
    approval: evaluateApproval(view, change.path),
    tasksDone: [...progress.tasks.values()].filter((commit) => commit !== null).length,
    tasksTotal: progress.tasks.size,
  };
  if (progress.branch !== undefined) status.branch = progress.branch;
  if (progress.landed !== undefined) status.landed = progress.landed;
  return status;
}

/** Why building may not start on this branch; empty when the build gate passes. */
export function buildGateReasons(view: ProjectView, branch: string | null): string[] {
  const change = activeChange(view, branch);
  if (change === undefined) return [`no change is bound to branch ${branch ?? "(none)"}; approve a planned change on this branch first`];
  const required = [change.path];
  const feature = featureOf(view.items, change);
  if (feature !== undefined) required.push(feature.path);
  if (view.snapshot.has(PATHS.architecture)) required.push(PATHS.architecture);
  return required.flatMap((path) => {
    const status = evaluateApproval(view, path);
    if (status.state === "approved") return [];
    const detail = status.changed.length > 0 ? `: ${status.changed.join(", ")} changed` : status.unjournaled === true ? ": the approval has no journal entry" : "";
    return [`${path} is ${status.state}${detail}`];
  });
}

/** The elements a change touches: its scope plus every ID its documents cite. */
export function touchedIds(view: ProjectView, change: WorkItem): Set<string> {
  const feature = featureOf(view.items, change);
  const scope = readScope(change.doc);
  const ids = new Set([...(scope?.delivers ?? []), ...(scope?.builds ?? []), ...(scope?.removes ?? [])]);
  const deltaDoc = feature?.doc ?? change.doc;
  for (const id of readDelta(deltaDoc).ids) ids.add(id);
  for (const id of findIds(change.doc.lines.join("\n"))) ids.add(id);
  return new Set([...ids].filter((id) => !id.startsWith("RULE-")));
}
