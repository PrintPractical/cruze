/** Where Cruze documents live in a project. */

/** Project files by path, relative to the project root, with forward slashes. */
export type Snapshot = ReadonlyMap<string, string>;

export const PATHS = {
  readme: "README.md",
  vision: "docs/vision.md",
  architecture: "docs/architecture.md",
  featuresDir: "docs/features",
  config: ".cruze/config.yaml",
  approvals: ".cruze/approvals.json",
} as const;

export function featurePath(slug: string): string {
  return `${PATHS.featuresDir}/${slug}.md`;
}

/** The feature slug of a path directly under docs/features/, or undefined. */
export function slugOfFeaturePath(path: string): string | undefined {
  const prefix = `${PATHS.featuresDir}/`;
  if (!path.startsWith(prefix) || !path.endsWith(".md")) return undefined;
  const rest = path.slice(prefix.length, -3);
  return rest.includes("/") ? undefined : rest;
}
