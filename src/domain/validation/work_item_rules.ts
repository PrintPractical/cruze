import { isUnbuilt } from "../elements.ts";
import { findIds, kindOf } from "../ids.ts";
import { elementHash } from "../hashing.ts";
import { findSection, type MarkdownDoc } from "../markdown.ts";
import { readDelta, type Delta } from "../project/deltas.ts";
import { readChangesTable, readScope } from "../project/plan_parts.ts";
import { readProgress } from "../project/progress.ts";
import type { ProjectView } from "../project/project_view.ts";
import { changesOf, featureOf, type WorkItem } from "../project/work_items.ts";
import { deltaProblems } from "./delta_rules.ts";
import { malformedIdHeadings, lineOf } from "./living_rules.ts";
import { changePlanProblems } from "./plan_rules.ts";
import { error, warning, type Problem } from "./problem.ts";

const REQUIRED_SECTIONS: Record<WorkItem["kind"], string[]> = {
  feature: ["Intent", "Spec delta", "Architecture delta", "Changes"],
  change: ["Scope", "Test plan", "Tasks"],
  standalone: ["Intent", "Spec delta", "Architecture delta", "Scope", "Test plan", "Tasks"],
};

/** Rules for every active feature and change. Archived work is history and is not checked. */
export function workItemProblems(view: ProjectView): Problem[] {
  return view.items.filter((item) => !item.archived).flatMap((item) => itemProblems(view, item));
}

function itemProblems(view: ProjectView, item: WorkItem): Problem[] {
  const { path, doc } = item;
  const problems: Problem[] = [...malformedIdHeadings(path, doc)];
  const id = doc.frontmatter?.["id"];
  if (id !== item.folderName) problems.push(error(path, 0, "frontmatter", `frontmatter id must be "${item.folderName}", the folder name`));
  const title = doc.frontmatter?.["title"];
  if (typeof title !== "string" || title.trim() === "") problems.push(error(path, 0, "frontmatter", "frontmatter needs a title"));
  for (const section of REQUIRED_SECTIONS[item.kind]) {
    if (findSection(doc, section) === null) problems.push(error(path, undefined, "missing-section", `missing "## ${section}"`));
  }

  const feature = item.kind === "change" ? featureOf(view.items, item) : undefined;
  if (item.kind === "change" && feature === undefined) problems.push(error(path, undefined, "orphan-change", "the change's feature.md is missing"));
  const deltaSource = item.kind === "change" ? feature : item;
  const delta = deltaSource === undefined ? readDelta(doc) : readDelta(deltaSource.doc);
  const available = new Set([...view.living.elements.keys(), ...delta.ids]);

  const text = doc.lines.join("\n");
  for (const cited of findIds(text).filter((cited) => !available.has(cited))) {
    problems.push(error(path, lineOf(text, cited), "unknown-id", `${cited} is cited but defined neither in the living docs nor in this work's deltas`));
  }
  if (item.kind !== "change") problems.push(...deltaProblems(view, item));
  if (item.kind === "feature") problems.push(...featureScopeProblems(view, item, delta));
  // A landed change is history: its scope named what it built, which is now built.
  const landed = item.kind !== "feature" && readProgress(doc).landed !== undefined;
  if (item.kind !== "feature" && deltaSource !== undefined && !landed) {
    problems.push(...changePlanProblems(view, path, doc, { delta, doc: deltaSource.doc }, available));
  }
  if (item.kind === "standalone") problems.push(...coverageProblems(view, path, delta, doc, [{ name: "this change", ids: scopeIds(item) }]));
  return problems;
}

/** A feature's Changes table covers its deltas, and each change folder agrees with its row. */
function featureScopeProblems(view: ProjectView, feature: WorkItem, delta: Delta): Problem[] {
  const rows = readChangesTable(feature.doc);
  if (rows.length === 0) return [warning(feature.path, undefined, "not-designed", "the feature has no changes yet; architect designs and splits it")];
  const problems: Problem[] = [];
  const landedChanges = new Set(
    [...readProgress(feature.doc).changes].filter(([, state]) => state === "landed").map(([change]) => change),
  );
  const names = rows.map((row) => row.change);
  for (const row of rows) {
    if (!/^\d\d-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(row.change)) problems.push(error(feature.path, row.line, "change-name", `change "${row.change}" must be named NN-slug`));
    if (names.indexOf(row.change) !== names.lastIndexOf(row.change)) problems.push(error(feature.path, row.line, "change-name", `change ${row.change} is listed twice`));
    for (const dependency of row.dependsOn) {
      const at = names.indexOf(dependency);
      if (at === -1 || at >= names.indexOf(row.change)) problems.push(error(feature.path, row.line, "change-order", `${row.change} depends on ${dependency}, which must be an earlier change`));
    }
    for (const id of landedChanges.has(row.change) ? [] : [...row.delivers, ...row.builds]) {
      const living = view.living.elements.get(id);
      const planned = living !== undefined && isUnbuilt(living.doc, living.element);
      if (!delta.ids.has(id) && !planned) problems.push(error(feature.path, row.line, "scope-not-planned", `${id} must come from this feature's deltas or be planned in the living docs`));
    }
  }
  problems.push(...coverageProblems(view, feature.path, delta, feature.doc, rows.map((row) => ({ name: row.change, ids: [...row.delivers, ...row.builds, ...row.removes] }))));

  for (const change of changesOf(view.items, feature)) {
    const row = rows.find((r) => r.change === change.folderName);
    if (row === undefined) {
      problems.push(error(change.path, undefined, "change-not-listed", `${change.folderName} is not in the feature's Changes table`));
      continue;
    }
    const expected = new Set([...row.delivers, ...row.builds, ...row.removes]);
    const actual = new Set(scopeIds(change));
    const differ = [...expected].filter((id) => !actual.has(id)).concat([...actual].filter((id) => !expected.has(id)));
    if (differ.length > 0) problems.push(error(change.path, readScope(change.doc)?.line, "scope-mismatch", `Scope differs from the feature's Changes row: ${differ.join(", ")}`));
  }
  return problems;
}

/**
 * Every delta ID lands exactly once. A requirement is covered by its own ID or one of its
 * scenarios. A scenario must be covered when it is new or its text changed; an unchanged
 * scenario kept by a MODIFIED requirement may be left out.
 */
function coverageProblems(
  view: ProjectView,
  path: string,
  delta: Delta,
  deltaDoc: MarkdownDoc,
  groups: Array<{ name: string; ids: string[] }>,
): Problem[] {
  const coveredBy = new Map<string, string[]>();
  for (const group of groups) for (const id of group.ids) coveredBy.set(id, [...(coveredBy.get(id) ?? []), group.name]);
  const problems: Problem[] = [];
  const once = (id: string, line: number, required: boolean): void => {
    const by = coveredBy.get(id) ?? [];
    if (required && by.length === 0) problems.push(error(path, line, "uncovered", `${id} is not in any change's scope`));
    if (by.length > 1) problems.push(error(path, line, "covered-twice", `${id} is in the scope of ${by.join(" and ")}; it must land exactly once`));
  };
  for (const { element, scenarios } of delta.entries) {
    if (kindOf(element.id) !== "REQ") {
      once(element.id, element.start, true);
      continue;
    }
    once(element.id, element.start, false);
    if (![element.id, ...scenarios.map((s) => s.id)].some((id) => coveredBy.has(id))) {
      problems.push(error(path, element.start, "uncovered", `${element.id} is not delivered by any change`));
    }
    for (const scenario of scenarios) {
      const living = view.living.elements.get(scenario.id);
      const changed = living === undefined || elementHash(living.doc, living.element) !== elementHash(deltaDoc, scenario);
      once(scenario.id, scenario.start, element.op !== "REMOVED" && changed);
    }
  }
  return problems;
}

function scopeIds(item: WorkItem): string[] {
  const scope = readScope(item.doc);
  return scope === null ? [] : [...scope.delivers, ...scope.builds, ...scope.removes];
}
