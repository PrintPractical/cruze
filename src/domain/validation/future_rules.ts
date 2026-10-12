import { factsOf, headingElements } from "../elements.ts";
import { readRows } from "../edits/managed_tables.ts";
import { findIds, kindOf } from "../ids.ts";
import type { MarkdownDoc } from "../markdown.ts";
import { PATHS } from "../project/layout.ts";
import { readDelta } from "../project/deltas.ts";
import type { ProjectView } from "../project/project_view.ts";
import { readRoadmapItems } from "../project/roadmap.ts";
import { warning, type Problem } from "./problem.ts";

/**
 * A `Future` fact keeps room for a need someone stated: a `LATER` capability of the vision, or a
 * feature on the feature map or the roadmap. One that names neither reserves room for a need nobody
 * stated, which the design reviewer treats as a finding; this makes it visible without a review.
 */
export function futureProblems(view: ProjectView): Problem[] {
  const slugs = anchorSlugs(view);
  const unanchored = (text: string): boolean =>
    !findIds(text).some((id) => kindOf(id) === "LATER") && ![...slugs].some((slug) => new RegExp(`(^|[^a-z0-9-])${slug}([^a-z0-9-]|$)`).test(text));
  const check = (path: string, doc: MarkdownDoc, from = 0, to = doc.lines.length): Problem[] =>
    headingElements(doc, from, to).flatMap((element) =>
      (factsOf(doc, element).get("Future") ?? [])
        .filter(unanchored)
        .map(() => warning(path, element.start, "future-unanchored", `${element.id} keeps room for a need its Future fact doesn't name; cite the LATER capability, or the feature on the map or roadmap, that it serves`)),
    );
  const living = view.living.docs.get(PATHS.architecture);
  const deltas = view.items
    .filter((item) => !item.archived && item.kind !== "change")
    .flatMap((item) => readDelta(item.doc).entries.flatMap((entry) => check(item.path, item.doc, entry.element.start, entry.element.end)));
  return [...(living === undefined ? [] : check(PATHS.architecture, living)), ...deltas];
}

/** Feature slugs a Future fact may name: the feature map's, implemented or future, and the roadmap's items. */
function anchorSlugs(view: ProjectView): Set<string> {
  const vision = view.snapshot.get(PATHS.vision) ?? "";
  const roadmap = view.snapshot.get(PATHS.roadmap);
  const mapped = ["Implemented", "Future"].flatMap((heading) => readRows(vision, heading).map((row) => row[0] ?? ""));
  const planned = roadmap === undefined ? [] : readRoadmapItems(roadmap).map((item) => item.slug);
  return new Set([...mapped, ...planned].map((slug) => slug.trim()).filter((slug) => /^[a-z0-9-]+$/.test(slug)));
}
