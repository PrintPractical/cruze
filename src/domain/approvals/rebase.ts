import { elementHash } from "../hashing.ts";
import type { MarkdownDoc } from "../markdown.ts";
import { readDelta } from "../project/deltas.ts";
import { approvalFolder, type ProjectView } from "../project/project_view.ts";
import type { WorkItem } from "../project/work_items.ts";
import { latestApproval } from "./records.ts";

/**
 * Delta elements a feature or standalone change merged and hasn't changed since. The merge did
 * their job, so the living text is the one to keep: an edit there by a rethink, a realign or
 * another land asks nothing of the delta. One project's delta went stale this way, and every
 * later edit of an element its first change had merged forced a rebase of text with no work left in it.
 */
export function settledIds(doc: MarkdownDoc, merged: Record<string, string>): Set<string> {
  const settled = new Set<string>();
  for (const entry of readDelta(doc).entries) {
    for (const element of [entry.element, ...entry.scenarios]) {
      if (merged[element.id] === elementHash(doc, element)) settled.add(element.id);
    }
  }
  return settled;
}

/**
 * Elements the work's delta still changes whose living text moved since its last approval:
 * approving the delta as it stands would overwrite that edit. A change's own approval pins no delta.
 */
export function rebaseNeeded(view: ProjectView, item: WorkItem): string[] {
  if (item.kind === "change") return [];
  const file = view.approvals.get(approvalFolder(view, item.path));
  const previous = file === undefined ? undefined : latestApproval(file, item.path);
  if (previous === undefined) return [];
  const settled = settledIds(item.doc, file?.merged ?? {});
  return [...readDelta(item.doc).ids].filter((id) => {
    const living = view.living.elements.get(id);
    const before = previous.upstream[id];
    return !settled.has(id) && living !== undefined && before !== undefined && before !== elementHash(living.doc, living.element);
  });
}
