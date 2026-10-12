import { evaluateApproval, type ApprovalStatus } from "../approvals/evaluate.ts";
import { PATHS } from "../project/layout.ts";
import { readDelta } from "../project/deltas.ts";
import { readChangesTable, readScope } from "../project/plan_parts.ts";
import { readProgress } from "../project/progress.ts";
import type { ProjectView } from "../project/project_view.ts";
import { changesOf, featureOf, type WorkItem } from "../project/work_items.ts";
import { pendingReason, pendingRethinks } from "./pending_rethink.ts";

export interface ChangeStatus {
  ref: string;
  path: string;
  approval: ApprovalStatus;
  branch?: string;
  tasksDone: number;
  tasksTotal: number;
  /** When and in which commit the change landed, once it has. */
  landed?: string;
  /** Findings decided for a rethink of this change that hasn't happened yet. */
  rethinkPending?: string[];
}

export interface FeatureStatus {
  ref: string;
  path: string;
  approval: ApprovalStatus;
  changes: ChangeStatus[];
  /** Findings decided for a rethink of this feature that hasn't happened yet. */
  rethinkPending?: string[];
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
      ...withPending(view, feature),
    }));
  const standalone = active.filter((item) => item.kind === "standalone").map((change) => changeStatus(view, change));
  const status: ProjectStatus = { documents, features, standalone };
  const bound = activeChange(view, branch);
  if (bound !== undefined) status.active = bound.ref;
  return status;
}

export function activeChange(view: ProjectView, branch: string | null): WorkItem | undefined {
  if (branch === null) return undefined;
  return view.items.find((item) => {
    const progress = readProgress(item.doc);
    return !item.archived && item.kind !== "feature" && progress.landed === undefined && progress.branch === branch;
  });
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
  return { ...status, ...withPending(view, change) };
}

function withPending(view: ProjectView, item: WorkItem): { rethinkPending?: string[] } {
  const pending = pendingRethinks(view.journal, item);
  return pending.length === 0 ? {} : { rethinkPending: pending.map((e) => String(e["finding"] ?? "")) };
}

/** Why building may not start on this branch; empty when the build gate passes. */
export function buildGateReasons(view: ProjectView, branch: string | null): string[] {
  const change = activeChange(view, branch);
  if (change === undefined) return [`no change is bound to branch ${branch ?? "(none)"}; approve a planned change on this branch first`];
  const required = [change.path];
  const feature = featureOf(view.items, change);
  if (feature !== undefined) required.push(feature.path);
  if (view.snapshot.has(PATHS.architecture)) required.push(PATHS.architecture);
  const approvals = required.flatMap((path) => {
    const status = evaluateApproval(view, path);
    if (status.state === "approved") return [];
    const detail = status.changed.length > 0 ? `: ${status.changed.join(", ")} changed` : status.unjournaled === true ? ": the approval has no journal entry" : "";
    return [`${path} is ${status.state}${detail}`];
  });
  const rethinks = [feature, change].flatMap((part) => {
    const pending = part === undefined ? [] : pendingRethinks(view.journal, part);
    return part === undefined || pending.length === 0 ? [] : [`${pendingReason(part, pending)}; run rethink`];
  });
  return [...approvals, ...rethinks, ...unlandedDependencies(view, change, feature)];
}

/** The changes this change's row in its feature's Changes table depends on that haven't landed on this branch. */
function unlandedDependencies(view: ProjectView, change: WorkItem, feature: WorkItem | undefined): string[] {
  if (feature === undefined) return [];
  const row = readChangesTable(feature.doc).find((r) => r.change === change.folderName);
  const landed = new Set(changesOf(view.items, feature).filter((c) => readProgress(c.doc).landed !== undefined).map((c) => c.folderName));
  return (row?.dependsOn ?? [])
    .filter((dependency) => !landed.has(dependency))
    .map((dependency) => `${change.ref} depends on ${dependency}, which hasn't landed here; land it, then merge main into this branch`);
}

/** The elements a change touches: its scope and its delta, not the elements it only cites, such as a test seam. */
export function touchedIds(view: ProjectView, change: WorkItem): Set<string> {
  const feature = featureOf(view.items, change);
  const scope = readScope(change.doc);
  const ids = new Set([...(scope?.delivers ?? []), ...(scope?.builds ?? []), ...(scope?.removes ?? [])]);
  const deltaDoc = feature?.doc ?? change.doc;
  for (const id of readDelta(deltaDoc).ids) ids.add(id);
  return new Set([...ids].filter((id) => !id.startsWith("RULE-")));
}
