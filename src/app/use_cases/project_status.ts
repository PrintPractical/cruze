import { CruzeError } from "../../domain/cruze_error.ts";
import { readProgress } from "../../domain/project/progress.ts";
import { buildProjectView } from "../../domain/project/project_view.ts";
import { nextSteps, type NextReport } from "../../domain/status/next_step.ts";
import { activeChange, buildGateReasons, projectStatus, touchedIds, type ProjectStatus } from "../../domain/status/work_status.ts";
import { appendJournal, loadView, type ProjectDeps } from "../project_context.ts";

export interface StatusReport extends ProjectStatus {
  branch: string | null;
}

export async function showStatus(deps: ProjectDeps): Promise<StatusReport> {
  const branch = await deps.repository.currentBranch();
  return { branch, ...projectStatus(await loadView(deps.files), branch) };
}

/** The step to run next on this branch, and other work that could proceed. */
export async function suggestNext(deps: ProjectDeps): Promise<NextReport & { branch: string | null }> {
  const branch = await deps.repository.currentBranch();
  return { branch, ...nextSteps(await loadView(deps.files), branch) };
}

export interface GateReport {
  gate: "build";
  passed: boolean;
  reasons: string[];
  overridden: boolean;
}

/**
 * The build gate: the change bound to this branch, its feature and the architecture are
 * all approved and current. An override passes the gate and is journaled with its reason.
 */
export async function checkBuildGate(deps: ProjectDeps, override?: string): Promise<GateReport> {
  const view = await loadView(deps.files);
  const branch = await deps.repository.currentBranch();
  const reasons = buildGateReasons(view, branch);
  if (reasons.length === 0) return { gate: "build", passed: true, reasons, overridden: false };
  if (override === undefined) return { gate: "build", passed: false, reasons, overridden: false };
  if (override.trim() === "") throw new CruzeError("override-reason", "an override needs a reason");
  const folder = activeChange(view, branch)?.folder ?? ".cruze";
  await appendJournal(deps, folder, "override", { gate: "build", reason: override, blocked_by: reasons });
  return { gate: "build", passed: true, reasons, overridden: true };
}

export interface Overlap {
  branch: string;
  item: string;
  shared: string[];
}

/** In-flight work on other branches that touches the same elements as this branch's change. */
export async function findOverlaps(deps: ProjectDeps, ref?: string): Promise<{ change: string; overlaps: Overlap[] }> {
  const view = await loadView(deps.files);
  const branch = await deps.repository.currentBranch();
  const change = ref === undefined ? activeChange(view, branch) : view.items.find((item) => item.ref === ref);
  if (change === undefined) throw new CruzeError("no-active-change", "no change is bound to this branch; name one with --change");
  const mine = touchedIds(view, change);
  const overlaps: Overlap[] = [];
  for (const other of await deps.repository.otherBranches()) {
    const theirs = buildProjectView(new Map([...view.snapshot].filter(([p]) => p.startsWith("docs/")).concat([...(await deps.repository.filesOnBranch(other, ".cruze"))])));
    // Work in flight on a branch is the change bound to it.
    const boundThere = theirs.items.filter((i) => {
      const bound = readProgress(i.doc).branch;
      return !i.archived && i.ref !== change.ref && bound !== undefined && (other === bound || other.endsWith(`/${bound}`));
    });
    for (const item of boundThere) {
      const shared = [...touchedIds(theirs, item)].filter((id) => mine.has(id));
      if (shared.length > 0) overlaps.push({ branch: other, item: item.ref, shared: shared.sort() });
    }
  }
  return { change: change.ref, overlaps };
}
