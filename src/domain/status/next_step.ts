import { evaluateApproval } from "../approvals/evaluate.ts";
import { PATHS } from "../project/layout.ts";
import { isPlanned, readChangesTable } from "../project/plan_parts.ts";
import { readProgress } from "../project/progress.ts";
import type { ProjectView } from "../project/project_view.ts";
import { readRoadmapItems, readRoadmapStatus } from "../project/roadmap.ts";
import { changesOf, featureOf, type WorkItem } from "../project/work_items.ts";
import { isVerified } from "./verification.ts";
import { activeChange } from "./work_status.ts";

/** The Cruze step to run next, computed from the project's state and the current branch. */

export type Step = "envision" | "architect" | "roadmap" | "plan" | "build" | "verify" | "land" | "rethink" | "switch-branch";

export interface NextStep {
  step: Step;
  /** What the step works on: a feature or change ref, a roadmap slug, or a branch. */
  target?: string;
  reason: string;
}

export interface NextReport {
  next: NextStep;
  /** Other work that could proceed, such as changes waiting on their own branches. */
  also: NextStep[];
}

export function nextSteps(view: ProjectView, branch: string | null): NextReport {
  const project = projectStep(view);
  if (project !== null) return { next: project, also: [] };
  const active = activeChange(view, branch);
  const inFlight = view.items.filter((item) => !item.archived && item.kind !== "change").flatMap((item) => itemSteps(view, item, branch));
  const roadmap = roadmapStep(view);
  const candidates = [...(active === undefined ? [] : [changeStep(view, active, branch)]), ...inFlight, ...(roadmap === null ? [] : [roadmap])];
  const unique = candidates.filter((c, i) => candidates.findIndex((o) => o.step === c.step && o.target === c.target) === i);
  const [next, ...also] = unique;
  return { next: next ?? { step: "roadmap", reason: "every item on the roadmap has landed; close the release and plan the next" }, also };
}

/** The project documents come first: nothing else can proceed without them. */
function projectStep(view: ProjectView): NextStep | null {
  const docs: Array<{ path: string; missing: NextStep; unapproved: NextStep; changed: NextStep }> = [
    {
      path: PATHS.vision,
      missing: { step: "envision", reason: "the project has no vision yet" },
      unapproved: { step: "envision", reason: "finish the vision and approve it" },
      changed: { step: "envision", reason: "the vision changed since its approval; review the change and approve it again" },
    },
    {
      path: PATHS.architecture,
      missing: { step: "architect", reason: "the project has no architecture yet" },
      unapproved: { step: "architect", reason: "finish the architecture, walk through it and approve it" },
      changed: { step: "rethink", target: "architecture", reason: "the architecture changed since its approval" },
    },
    {
      path: PATHS.roadmap,
      missing: { step: "architect", reason: "the project has no roadmap yet" },
      unapproved: { step: "roadmap", reason: "approve the release ordering" },
      changed: { step: "roadmap", reason: "the roadmap changed since its approval; approve the new ordering" },
    },
  ];
  for (const doc of docs) {
    if (!view.snapshot.has(doc.path)) return doc.missing;
    const state = evaluateApproval(view, doc.path).state;
    if (state === "unapproved") return doc.unapproved;
    if (state !== "approved") return doc.changed;
  }
  return null;
}

function itemSteps(view: ProjectView, item: WorkItem, branch: string | null): NextStep[] {
  if (item.kind === "standalone") return [changeStep(view, item, branch)];
  const state = evaluateApproval(view, item.path);
  if (readChangesTable(item.doc).length === 0) return [{ step: "architect", target: item.ref, reason: "the feature has no design or changes yet" }];
  if (state.state === "unapproved") return [{ step: "architect", target: item.ref, reason: "review the feature's design, walk through it and approve it" }];
  if (state.state !== "approved") return [{ step: "rethink", target: item.ref, reason: `the feature changed since its approval${state.changed.length > 0 ? ` (${state.changed.join(", ")})` : ""}` }];
  const changes = changesOf(view.items, item);
  const landed = new Set(changes.filter((c) => readProgress(c.doc).landed !== undefined).map((c) => c.folderName));
  const steps: NextStep[] = [];
  for (const row of readChangesTable(item.doc)) {
    const change = changes.find((c) => c.folderName === row.change);
    if (change !== undefined) {
      if (!landed.has(row.change)) steps.push(changeStep(view, change, branch));
    } else if (row.dependsOn.every((d) => landed.has(d))) {
      steps.push({ step: "plan", target: `${item.ref}/${row.change}`, reason: "the next change of an approved feature, with its dependencies landed" });
    }
  }
  return steps;
}

function changeStep(view: ProjectView, change: WorkItem, branch: string | null): NextStep {
  const feature = featureOf(view.items, change);
  const featureState = feature === undefined ? undefined : evaluateApproval(view, feature.path);
  if (feature !== undefined && featureState !== undefined && featureState.state !== "approved") {
    const why = featureState.changed.length > 0 ? ` (${featureState.changed.join(", ")})` : "";
    return { step: "rethink", target: feature.ref, reason: `the feature of ${change.ref} changed since its approval${why}` };
  }
  const bound = readProgress(change.doc).branch;
  const state = evaluateApproval(view, change.path);
  if (!isPlanned(change.doc)) return { step: "plan", target: change.ref, reason: "the change is designed but has no test plan or tasks yet" };
  if (state.state === "unapproved") return { step: "plan", target: change.ref, reason: "review the plan and approve it on the branch that will build it" };
  if (state.state !== "approved") return { step: "rethink", target: change.ref, reason: `the change or something it cites changed since its approval${state.changed.length > 0 ? ` (${state.changed.join(", ")})` : ""}` };
  if (bound !== undefined && bound !== branch) return { step: "switch-branch", target: bound, reason: `${change.ref} is built on branch ${bound}` };
  const progress = readProgress(change.doc);
  if ([...progress.tasks.values()].some((commit) => commit === null)) return { step: "build", target: change.ref, reason: "the change has open tasks" };
  if (!isVerified(view.journal, change)) return { step: "verify", target: change.ref, reason: "every task is done; verify the change" };
  return { step: "land", target: change.ref, reason: "the change is verified and accepted" };
}

/** The first roadmap item that hasn't started and whose blockers have all landed. */
function roadmapStep(view: ProjectView): NextStep | null {
  const text = view.snapshot.get(PATHS.roadmap);
  if (text === undefined) return null;
  const status = new Map(readRoadmapStatus(text).map((row) => [row.slug, row.state]));
  const item = readRoadmapItems(text).find((i) => !status.has(i.slug) && i.blockedBy.every((b) => status.get(b) === "landed"));
  if (item === undefined) return null;
  if (item.kind === "feature") return { step: "envision", target: item.slug, reason: "the next roadmap feature; skip to architect when its requirements are settled" };
  return { step: "architect", target: item.slug, reason: "the next roadmap change; design it as a tweak" };
}
