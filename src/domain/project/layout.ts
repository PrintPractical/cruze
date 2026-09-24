/** Where Cruze documents live in a project, and the snapshot of them the domain works on. */

/** Project files by path, relative to the project root, with forward slashes. */
export type Snapshot = ReadonlyMap<string, string>;

export const PATHS = {
  vision: "docs/vision.md",
  glossary: "docs/glossary.md",
  architecture: "docs/architecture.md",
  roadmap: "docs/roadmap.md",
  adrDir: "docs/adr",
  specsDir: "docs/specs",
  config: ".cruze/config.yaml",
  featuresDir: ".cruze/features",
  changesDir: ".cruze/changes",
  archiveDir: ".cruze/archive",
  projectApprovals: ".cruze/approvals.json",
  projectJournal: ".cruze/journal.jsonl",
} as const;

/** Directories whose files make up the snapshot. */
export const SNAPSHOT_ROOTS = ["docs", ".cruze"] as const;

export function specPath(capability: string): string {
  return `${PATHS.specsDir}/${capability}.md`;
}

export function filesUnder(snapshot: Snapshot, dir: string): string[] {
  const prefix = `${dir}/`;
  return [...snapshot.keys()].filter((path) => path.startsWith(prefix)).sort();
}

/** Paths directly matching `<dir>/<name><suffix>`, one level deep. */
export function childFiles(snapshot: Snapshot, dir: string, suffix: string): string[] {
  return filesUnder(snapshot, dir).filter((path) => {
    const rest = path.slice(dir.length + 1);
    return !rest.includes("/") && rest.endsWith(suffix);
  });
}
