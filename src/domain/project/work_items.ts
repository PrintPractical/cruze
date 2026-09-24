import { parseMarkdown, type MarkdownDoc } from "../markdown.ts";
import { PATHS, filesUnder, type Snapshot } from "./layout.ts";

export type WorkItemKind = "feature" | "change" | "standalone";

/** A feature, a change inside a feature, or a standalone change. */
export interface WorkItem {
  kind: WorkItemKind;
  /** `<feature id>`, `<feature id>/<change>` or `<standalone id>`. */
  ref: string;
  /** The ID its frontmatter must carry: the folder name. */
  folderName: string;
  folder: string;
  path: string;
  doc: MarkdownDoc;
  archived: boolean;
  /** For a change inside a feature: the feature's ref. */
  featureRef?: string;
}

const FEATURE = /^\.cruze\/(features|archive)\/([^/]+)\/feature\.md$/;
const FEATURE_CHANGE = /^\.cruze\/(features|archive)\/([^/]+)\/changes\/([^/]+)\/change\.md$/;
const STANDALONE = /^\.cruze\/(changes|archive)\/([^/]+)\/change\.md$/;

export function listWorkItems(snapshot: Snapshot): WorkItem[] {
  const paths = [...filesUnder(snapshot, PATHS.featuresDir), ...filesUnder(snapshot, PATHS.changesDir), ...filesUnder(snapshot, PATHS.archiveDir)];
  return paths.flatMap((path) => {
    const item = classify(path);
    return item === null ? [] : [{ ...item, path, doc: parseMarkdown(snapshot.get(path) ?? "") }];
  });
}

export function findWorkItem(items: WorkItem[], ref: string): WorkItem | undefined {
  return items.find((item) => item.ref === ref || item.path === ref || item.folder === ref);
}

/** The feature a change belongs to. */
export function featureOf(items: WorkItem[], change: WorkItem): WorkItem | undefined {
  return change.featureRef === undefined ? undefined : items.find((item) => item.kind === "feature" && item.ref === change.featureRef);
}

export function changesOf(items: WorkItem[], feature: WorkItem): WorkItem[] {
  return items.filter((item) => item.featureRef === feature.ref).sort((a, b) => a.ref.localeCompare(b.ref));
}

function classify(path: string): Omit<WorkItem, "path" | "doc"> | null {
  const folder = path.slice(0, path.lastIndexOf("/"));
  let match = FEATURE.exec(path);
  if (match?.[2] !== undefined) {
    return { kind: "feature", ref: match[2], folderName: match[2], folder, archived: match[1] === "archive" };
  }
  match = FEATURE_CHANGE.exec(path);
  if (match?.[2] !== undefined && match[3] !== undefined) {
    return {
      kind: "change",
      ref: `${match[2]}/${match[3]}`,
      folderName: match[3],
      folder,
      archived: match[1] === "archive",
      featureRef: match[2],
    };
  }
  match = STANDALONE.exec(path);
  if (match?.[2] !== undefined) {
    return { kind: "standalone", ref: match[2], folderName: match[2], folder, archived: match[1] === "archive" };
  }
  return null;
}
