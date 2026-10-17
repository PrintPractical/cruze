import { parseApprovals, type ApprovalRecord } from "../approvals.ts";
import { parseConfig, type ConfigResult } from "../config.ts";
import { parseMarkdown, type MarkdownDoc } from "../markdown.ts";
import { readFeature, type Feature } from "./features.ts";
import { PATHS, slugOfFeaturePath, type Snapshot } from "./layout.ts";
import { readRelease, type ReleaseFeature } from "./release.ts";

/** Every Cruze document of a project, parsed: what the use cases work on. */
export interface ProjectDocs {
  snapshot: Snapshot;
  config: ConfigResult | undefined;
  vision: MarkdownDoc | undefined;
  architecture: MarkdownDoc | undefined;
  release: ReleaseFeature[];
  /** Feature documents, by slug, in slug order. */
  features: Feature[];
  approvals: ApprovalRecord[];
}

export function buildProjectDocs(snapshot: Snapshot): ProjectDocs {
  const read = (path: string): MarkdownDoc | undefined => {
    const text = snapshot.get(path);
    return text === undefined ? undefined : parseMarkdown(text);
  };
  const configText = snapshot.get(PATHS.config);
  const vision = read(PATHS.vision);
  const features = [...snapshot.keys()]
    .flatMap((path) => {
      const slug = slugOfFeaturePath(path);
      return slug === undefined ? [] : [readFeature(slug, snapshot.get(path) ?? "")];
    })
    .sort((a, b) => a.slug.localeCompare(b.slug));
  return {
    snapshot,
    config: configText === undefined ? undefined : parseConfig(configText),
    vision,
    architecture: read(PATHS.architecture),
    release: vision === undefined ? [] : readRelease(vision),
    features,
    approvals: parseApprovals(snapshot.get(PATHS.approvals)),
  };
}

/** The document a reference names: `vision`, `architecture`, a feature slug, or a path. */
export function resolveDocument(docs: ProjectDocs, ref: string): string | undefined {
  const path = ref === "vision" ? PATHS.vision : ref === "architecture" ? PATHS.architecture : (docs.features.find((f) => f.slug === ref)?.path ?? ref);
  return docs.snapshot.has(path) ? path : undefined;
}
