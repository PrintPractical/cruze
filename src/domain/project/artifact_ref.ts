import { CruzeError } from "../cruze_error.ts";
import { PATHS } from "./layout.ts";
import type { ProjectView } from "./project_view.ts";
import { findWorkItem, type WorkItem } from "./work_items.ts";

const NAMED: Record<string, string> = { vision: PATHS.vision, architecture: PATHS.architecture, roadmap: PATHS.roadmap };

/**
 * Resolves what a person or skill names on the command line: `vision`, `architecture`,
 * `roadmap`, a work item ref such as `2026-09-25-open-console/01-local-serial`, or a path.
 */
export function resolveArtifact(view: ProjectView, ref: string): { path: string; item?: WorkItem } {
  const named = NAMED[ref];
  if (named !== undefined) {
    if (!view.snapshot.has(named)) throw new CruzeError("not-found", `${named} does not exist yet`);
    return { path: named };
  }
  const item = findWorkItem(view.items, ref.replace(/\/$/, ""));
  if (item !== undefined) return { path: item.path, item };
  if (view.snapshot.has(ref)) return { path: ref };
  throw new CruzeError("not-found", `nothing called "${ref}"; use vision, architecture, roadmap, a feature or change ID, or a path`);
}

/** Resolves a change: a feature's change or a standalone change, never archived. */
export function resolveChange(view: ProjectView, ref: string): WorkItem {
  const { item } = resolveArtifact(view, ref);
  if (item === undefined || item.kind === "feature") throw new CruzeError("not-a-change", `"${ref}" is not a change`);
  if (item.archived) throw new CruzeError("archived", `${item.ref} has already landed`);
  return item;
}
