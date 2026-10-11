import { definedDecisions, findDecisionCitations, workItemSlugs, type DecisionCitation } from "../decision_citations.ts";
import type { Element } from "../elements.ts";
import { findSection, type MarkdownDoc } from "../markdown.ts";
import { readDelta } from "../project/deltas.ts";
import { PATHS } from "../project/layout.ts";
import type { ProjectView } from "../project/project_view.ts";
import type { WorkItem } from "../project/work_items.ts";
import { warning, type Problem } from "./problem.ts";

const INSTEAD = "write what it decided into this text, or cite the ADR that records it";

/**
 * The architecture cites only the decisions its own `## Decisions` defines. The other living docs
 * cite none by number, and no living doc cites a feature's or change's, which is archived when it finishes.
 */
export function livingDecisionProblems(view: ProjectView): Problem[] {
  const slugs = slugsOf(view);
  const project = projectDecisions(view);
  const problems: Problem[] = [];
  for (const [path, doc] of view.living.docs) {
    for (const citation of citationsIn(doc, slugs)) {
      if (citation.qualifier !== undefined) {
        problems.push(warning(path, citation.line, "decision-citation", `cites ${citation.text}, a decision of ${citation.qualifier}, which the living docs don't hold; ${INSTEAD}`));
      } else if (path !== PATHS.architecture) {
        problems.push(warning(path, citation.line, "decision-citation", `cites ${citation.text}, but only the architecture cites decisions by number, its own; ${INSTEAD}`));
      } else {
        const unknown = citation.numbers.filter((n) => !project.has(n));
        if (unknown.length > 0) {
          problems.push(warning(path, citation.line, "decision-citation", `cites ${unknown.map((n) => `D${n}`).join(", ")}, which "## Decisions" doesn't define; ${INSTEAD}`));
        }
      }
    }
  }
  return problems;
}

/**
 * A delta's elements merge into the living docs, where the work's own decisions don't follow them.
 * They may cite a project decision the work doesn't renumber, or one the living element already cites.
 */
export function deltaDecisionProblems(view: ProjectView, item: WorkItem): Problem[] {
  const slugs = slugsOf(view);
  const project = projectDecisions(view);
  const local = definedDecisions(sectionLines(item.doc, "Settled decisions"));
  const problems: Problem[] = [];
  for (const { element } of readDelta(item.doc).entries) {
    const living = view.living.elements.get(element.id);
    const carried = new Set(living === undefined ? [] : citationsIn(living.doc, slugs, living.element).flatMap((c) => (c.qualifier === undefined ? c.numbers : [])));
    const allowed = (n: number): boolean => project.has(n) && (!local.has(n) || carried.has(n));
    for (const citation of citationsIn(item.doc, slugs, element)) {
      if (citation.qualifier === undefined && citation.numbers.every(allowed)) continue;
      problems.push(warning(item.path, citation.line, "decision-citation", `${element.id} cites ${citation.text}, which won't mean the same in the living docs once this delta merges; ${INSTEAD}`));
    }
  }
  return problems;
}

function citationsIn(doc: MarkdownDoc, slugs: Set<string>, element?: Element): DecisionCitation[] {
  const from = element === undefined ? doc.bodyStart : element.start + 1;
  const to = element === undefined ? doc.lines.length : element.end;
  return findDecisionCitations(doc.lines, slugs, (line) => line < from || line >= to || doc.inFence[line] === true || doc.inManaged[line] === true);
}

function projectDecisions(view: ProjectView): Set<number> {
  const architecture = view.living.docs.get(PATHS.architecture);
  return architecture === undefined ? new Set() : definedDecisions(sectionLines(architecture, "Decisions"));
}

function sectionLines(doc: MarkdownDoc, title: string): string[] {
  const range = findSection(doc, title);
  return range === null ? [] : doc.lines.slice(range.start, range.end);
}

function slugsOf(view: ProjectView): Set<string> {
  return workItemSlugs(view.items.map((item) => item.folderName));
}
