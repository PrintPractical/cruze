import { approvalState, type ApprovalState } from "../../domain/approvals.ts";
import { PATHS } from "../../domain/project/layout.ts";
import type { MarkdownDoc } from "../../domain/markdown.ts";
import { nextStep, type NextStep } from "../../domain/next_step.ts";
import type { FeatureStatus } from "../../domain/project/features.ts";
import { loadDocs, type ProjectDeps } from "../project_context.ts";

export interface DocumentStatus {
  path: string;
  state: ApprovalState | "missing";
}

export interface FeatureReport {
  slug: string;
  path?: string;
  /** Missing when the release lists it but nobody has shaped it yet. */
  status: FeatureStatus | "not-shaped" | "unknown";
  approval: ApprovalState | "missing";
  inRelease: boolean;
  needs: string[];
  scenarios: number;
}

export interface StatusReport {
  documents: DocumentStatus[];
  features: FeatureReport[];
  next: NextStep;
}

/** Each document's approval, and each feature's progress, in release order. */
export async function showStatus(deps: ProjectDeps): Promise<StatusReport> {
  const docs = await loadDocs(deps.files);
  const state = (path: string, doc: MarkdownDoc | undefined): ApprovalState | "missing" => (doc === undefined ? "missing" : approvalState(docs.approvals, path, doc));
  const documents = [
    { path: PATHS.vision, state: state(PATHS.vision, docs.vision) },
    { path: PATHS.architecture, state: state(PATHS.architecture, docs.architecture) },
  ];
  const slugs = [...docs.release.map((r) => r.slug), ...docs.features.map((f) => f.slug).filter((s) => !docs.release.some((r) => r.slug === s))];
  const features = slugs.map((slug): FeatureReport => {
    const feature = docs.features.find((f) => f.slug === slug);
    const row = docs.release.find((r) => r.slug === slug);
    return {
      slug,
      ...(feature === undefined ? {} : { path: feature.path }),
      status: feature === undefined ? "not-shaped" : (feature.status ?? "unknown"),
      approval: feature === undefined ? "missing" : approvalState(docs.approvals, feature.path, feature.doc),
      inRelease: row !== undefined,
      needs: row?.needs ?? [],
      scenarios: feature?.scenarios.length ?? 0,
    };
  });
  return { documents, features, next: nextStep(docs) };
}

/** The step to run next, and why. */
export async function suggestNext(deps: ProjectDeps): Promise<NextStep> {
  return nextStep(await loadDocs(deps.files));
}
