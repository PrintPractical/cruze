import { CruzeError } from "../cruze_error.ts";
import { readChangesTable } from "./plan_parts.ts";
import type { ProjectView } from "./project_view.ts";
import type { WorkItem } from "./work_items.ts";

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function requireSlug(slug: string): void {
  if (!SLUG.test(slug)) throw new CruzeError("invalid-slug", `"${slug}" must be lowercase words joined by single hyphens`);
}

/**
 * A new feature or standalone change ID: the date plus the slug, with `-2`, `-3`… added
 * on a clash with any live or archived work. IDs are never reused.
 */
export function allocateId(view: ProjectView, date: string, slug: string): string {
  requireSlug(slug);
  const taken = new Set(view.items.filter((item) => item.kind !== "change").map((item) => item.folderName));
  const base = `${date}-${slug}`;
  if (!taken.has(base)) return base;
  for (let n = 2; ; n++) if (!taken.has(`${base}-${n}`)) return `${base}-${n}`;
}

/**
 * The change folder name for a feature's change: the row of the feature's Changes table it
 * names, by full name (`01-local-serial`) or slug (`local-serial`).
 */
export function changeRow(view: ProjectView, feature: WorkItem, name: string): ReturnType<typeof readChangesTable>[number] {
  const rows = readChangesTable(feature.doc);
  const row = rows.find((r) => r.change === name) ?? rows.find((r) => r.change.replace(/^\d\d-/, "") === name);
  if (row === undefined) {
    throw new CruzeError("change-not-listed", `${feature.ref} has no change "${name}" in its Changes table; add the row first`);
  }
  if (view.items.some((item) => item.featureRef === feature.ref && item.folderName === row.change)) {
    throw new CruzeError("exists", `${feature.ref}/${row.change} already exists`);
  }
  return row;
}

/** Fills the template's frontmatter, title and scope lines for a new document. */
export function fillTemplate(template: string, values: { roadmap?: string; delivers?: string[]; builds?: string[] }): string {
  let text = template;
  if (values.roadmap !== undefined) text = text.replace(/^roadmap: .*$/m, `roadmap: ${values.roadmap}`);
  else text = text.replace(/^roadmap: <.*\n/m, "");
  if (values.delivers !== undefined) text = text.replace(/^- Delivers: .*$/m, `- Delivers: ${values.delivers.join(", ")}`);
  if (values.builds !== undefined) text = text.replace(/^- Builds: .*$/m, `- Builds: ${values.builds.join(", ")}`);
  return text;
}
