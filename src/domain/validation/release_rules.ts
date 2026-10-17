import { isSlug } from "../ids.ts";
import { PATHS } from "../project/layout.ts";
import type { ProjectDocs } from "../project/project_docs.ts";
import { error, warning, type Problem } from "./problem.ts";

/** The vision's Release table: feature slugs, what each needs, and no cycles. */
export function releaseProblems(docs: ProjectDocs): Problem[] {
  if (docs.vision === undefined) return [];
  if (docs.release.length === 0) return [warning(PATHS.vision, undefined, "release", "## Release has no Feature | Summary | Needs table with features in it yet")];
  const problems: Problem[] = [];
  const slugs = new Set<string>();
  for (const row of docs.release) {
    if (!isSlug(row.slug)) problems.push(error(PATHS.vision, row.line, "release", `"${row.slug}" must be a feature slug: lowercase words joined by single hyphens`));
    if (slugs.has(row.slug)) problems.push(error(PATHS.vision, row.line, "release", `${row.slug} is listed twice`));
    slugs.add(row.slug);
  }
  for (const row of docs.release) {
    for (const need of row.needs.filter((n) => !slugs.has(n))) {
      problems.push(error(PATHS.vision, row.line, "release-needs", `${row.slug} needs ${need}, which isn't a feature of this release`));
    }
  }
  const cycle = findCycle(docs.release.map((r) => [r.slug, r.needs.filter((n) => slugs.has(n))] as const));
  if (cycle !== undefined) problems.push(error(PATHS.vision, docs.release.find((r) => r.slug === cycle[0])?.line, "release-needs", `features need each other in a circle: ${cycle.join(" → ")}`));
  return problems;
}

function findCycle(graph: ReadonlyArray<readonly [string, readonly string[]]>): string[] | undefined {
  const edges = new Map(graph);
  const done = new Set<string>();
  const visit = (node: string, path: string[]): string[] | undefined => {
    if (path.includes(node)) return [...path.slice(path.indexOf(node)), node];
    if (done.has(node)) return undefined;
    for (const next of edges.get(node) ?? []) {
      const found = visit(next, [...path, node]);
      if (found !== undefined) return found;
    }
    done.add(node);
    return undefined;
  };
  for (const [node] of graph) {
    const found = visit(node, []);
    if (found !== undefined) return found;
  }
  return undefined;
}
