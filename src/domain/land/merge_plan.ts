import { sectionForKind } from "../architecture_sections.ts";
import { CruzeError } from "../cruze_error.ts";
import { setStatus } from "../edits/status_lines.ts";
import { headingElements, statusOf, type Element } from "../elements.ts";
import { elementHash } from "../hashing.ts";
import { STATUS_KINDS, kindOf, scopeOf } from "../ids.ts";
import { findSection, parseMarkdown } from "../markdown.ts";
import { readDelta, type DeltaEntry } from "../project/deltas.ts";
import { PATHS, specPath } from "../project/layout.ts";
import { readScope } from "../project/plan_parts.ts";
import type { ProjectView } from "../project/project_view.ts";
import type { WorkItem } from "../project/work_items.ts";
import { REMOVED_MARK, capabilityKey } from "../validation/delta_rules.ts";
import { appendBlock, relevel, removeElement, replaceElement } from "./text_ops.ts";

export interface MergePlan {
  /** New text of every living document the merge changes. */
  files: Map<string, string>;
  /** The work's merge record after this land: element ID to its merged hash. */
  merged: Record<string, string>;
  mergedIds: string[];
  built: string[];
  removed: string[];
}

/**
 * Merges a change's work into the living docs. The first change of a feature to land merges
 * the whole delta; elements it doesn't build arrive as planned, and later changes flip what
 * they build to built. Text is replaced only when nobody else changed it since this work merged it.
 */
export function planMerge(view: ProjectView, change: WorkItem, source: WorkItem): MergePlan {
  const scope = readScope(change.doc);
  const inScope = new Set([...(scope?.delivers ?? []), ...(scope?.builds ?? [])]);
  const delta = readDelta(source.doc);
  const merged = { ...(view.approvals.get(source.folder)?.merged ?? {}) };
  const files = new Map<string, string>();
  const text = (path: string): string => files.get(path) ?? view.snapshot.get(path) ?? "";
  const plan: MergePlan = { files, merged, mergedIds: [], built: [], removed: [] };

  for (const op of delta.capabilities) {
    const key = capabilityKey(op.capability);
    if (merged[key] !== undefined || view.snapshot.has(specPath(op.capability))) continue;
    const body = source.doc.lines.slice(op.start + 1, op.end).join("\n").trim();
    files.set(specPath(op.capability), `# ${op.title}\n\n${body}\n`);
    merged[key] = "created";
  }

  for (const entry of delta.entries) {
    const { id } = entry.element;
    const path = entry.section === "spec" ? specPath(scopeOf(id) ?? "") : PATHS.architecture;
    if (entry.element.op === "REMOVED") {
      if (scope?.removes.includes(id) === true) {
        files.set(path, removeElement(text(path), id));
        merged[id] = REMOVED_MARK;
        plan.removed.push(id);
      }
      continue;
    }
    mergeEntry(view, source, entry, path, text, files, merged, plan);
    for (const target of [entry.element, ...entry.scenarios].filter((e) => STATUS_KINDS.includes(e.kind))) {
      files.set(path, setStatus(text(path), target.id, statusAfterMerge(view, source, target, inScope)));
      if (inScope.has(target.id)) plan.built.push(target.id);
    }
  }

  for (const id of [...inScope].filter((id) => !delta.ids.has(id) && STATUS_KINDS.includes(kindOf(id)))) {
    const living = view.living.elements.get(id);
    if (living === undefined) continue;
    files.set(living.path, setStatus(text(living.path), id, "built"));
    plan.built.push(id);
  }
  verifyMerged(source, delta.entries, text, plan);
  return plan;
}

function mergeEntry(
  view: ProjectView,
  source: WorkItem,
  entry: DeltaEntry,
  path: string,
  text: (path: string) => string,
  files: Map<string, string>,
  merged: Record<string, string>,
  plan: MergePlan,
): void {
  const { id } = entry.element;
  const block = relevel(source.doc, entry.element.start, entry.element.end, entry.section === "spec" ? 2 : 3);
  const deltaHash = elementHash(source.doc, entry.element);
  const doc = parseMarkdown(text(path));
  const living = headingElements(doc).find((e) => e.id === id);
  const previous = merged[id];
  if (living !== undefined) {
    const livingHash = elementHash(doc, living);
    if (previous !== undefined && previous !== REMOVED_MARK && livingHash !== previous) {
      throw new CruzeError("merge-conflict", `${id} in ${path} changed since ${source.ref} merged it; rethink before landing`);
    }
    if (livingHash !== deltaHash) {
      files.set(path, replaceElement(text(path), id, block));
      plan.mergedIds.push(id);
    }
  } else {
    if (previous !== undefined && previous !== REMOVED_MARK) {
      throw new CruzeError("merge-conflict", `${id} was removed from ${path} after ${source.ref} merged it; rethink before landing`);
    }
    const section = entry.section === "spec" ? undefined : sectionForKind(entry.element.kind);
    if (section !== undefined && findSection(doc, section) === null) throw new CruzeError("merge-conflict", `${path} has no "## ${section}" section for ${id}`);
    files.set(path, appendBlock(text(path), block, section));
    plan.mergedIds.push(id);
  }
  merged[id] = deltaHash;
  for (const scenario of entry.scenarios) merged[scenario.id] = elementHash(source.doc, scenario);
}

/** Built when this change builds it, or when it was built and its text is unchanged; planned otherwise. */
function statusAfterMerge(view: ProjectView, source: WorkItem, target: Element, inScope: Set<string>): "planned" | "built" {
  if (inScope.has(target.id)) return "built";
  const before = view.living.elements.get(target.id);
  if (before === undefined || statusOf(before.doc, before.element) !== "built") return "planned";
  return elementHash(before.doc, before.element) === elementHash(source.doc, target) ? "built" : "planned";
}

/** After merging, every merged element must hash exactly as it did in the delta. */
function verifyMerged(source: WorkItem, entries: DeltaEntry[], text: (path: string) => string, plan: MergePlan): void {
  for (const entry of entries.filter((e) => plan.mergedIds.includes(e.element.id))) {
    const path = entry.section === "spec" ? specPath(scopeOf(entry.element.id) ?? "") : PATHS.architecture;
    const doc = parseMarkdown(text(path));
    const living = headingElements(doc).find((e) => e.id === entry.element.id);
    if (living === undefined || elementHash(doc, living) !== elementHash(source.doc, entry.element)) {
      throw new Error(`merge check failed: ${entry.element.id} in ${path} does not match the delta`);
    }
  }
}
