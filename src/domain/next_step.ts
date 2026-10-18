import { approvalState } from "./approvals.ts";
import { PATHS } from "./project/layout.ts";
import type { ProjectDocs } from "./project/project_docs.ts";

export type Step = "init" | "envision" | "shape" | "build";

export interface NextStep {
  step: Step;
  /** The feature the step works on, for shape and build. */
  target?: string;
  reason: string;
}

/**
 * The step to run next, from the documents alone. Work in progress comes first, in release order,
 * then the first release feature not yet shaped whose needs are all built.
 */
export function nextStep(docs: ProjectDocs): NextStep {
  if (docs.config === undefined) return { step: "init", reason: `${PATHS.config} is missing` };
  if (docs.vision === undefined) return { step: "envision", reason: "the project has no vision yet" };
  if (approvalState(docs.approvals, PATHS.vision, docs.vision) !== "approved") return { step: "envision", reason: "the vision isn't approved as it stands" };
  if (docs.architecture === undefined) return { step: "envision", reason: "the project has no architecture map yet" };
  if (approvalState(docs.approvals, PATHS.architecture, docs.architecture) !== "approved") return { step: "envision", reason: "the architecture map isn't approved as it stands" };

  const order = [...docs.release.map((r) => r.slug), ...docs.features.map((f) => f.slug).filter((slug) => !docs.release.some((r) => r.slug === slug))];
  for (const slug of order) {
    const feature = docs.features.find((f) => f.slug === slug);
    if (feature === undefined || feature.status === "built") continue;
    const state = approvalState(docs.approvals, feature.path, feature.doc);
    if (state === "unapproved") return { step: "shape", target: slug, reason: `${slug} is shaped but not approved` };
    if (state === "edited") return { step: "shape", target: slug, reason: `${slug} changed since its approval; show the user what changed and approve it again` };
    return { step: "build", target: slug, reason: `${slug} is approved and not built` };
  }

  const built = new Set(docs.features.filter((f) => f.status === "built").map((f) => f.slug));
  const pending = docs.release.filter((r) => !built.has(r.slug));
  const ready = pending.find((r) => !docs.features.some((f) => f.slug === r.slug) && r.needs.every((need) => built.has(need)));
  if (ready !== undefined) return { step: "shape", target: ready.slug, reason: ready.needs.length === 0 ? `${ready.slug} is next in the release` : `${ready.slug} is next in the release, and everything it needs is built` };
  if (pending.length > 0) return { step: "envision", reason: `no remaining release feature has all its needs built (${pending.map((r) => r.slug).join(", ")}); fix the Needs column` };
  return { step: "envision", reason: docs.release.length === 0 ? "the vision's Release table lists no features" : "every release feature is built; plan the next release" };
}
