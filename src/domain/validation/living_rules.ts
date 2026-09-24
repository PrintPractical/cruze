import { ARCHITECTURE_KINDS, sectionForKind } from "../architecture_sections.ts";
import { headingElements, statusOf, type Element } from "../elements.ts";
import { findIds, scopeOf, STATUS_KINDS } from "../ids.ts";
import type { MarkdownDoc } from "../markdown.ts";
import { PATHS } from "../project/layout.ts";
import type { ProjectView } from "../project/project_view.ts";
import { elementProblems } from "./element_rules.ts";
import { error, warning, type Problem } from "./problem.ts";

/** Rules for the living docs: vision, architecture, specs, ADRs and the IDs they cite. */
export function livingProblems(view: ProjectView): Problem[] {
  const problems: Problem[] = [];
  for (const { id, places } of view.living.duplicates) {
    problems.push(error(places[0]?.split(":")[0] ?? "", undefined, "duplicate-id", `${id} is defined more than once: ${places.join(", ")}`));
  }
  for (const [path, doc] of view.living.docs) {
    problems.push(...malformedIdHeadings(path, doc));
    if (path === PATHS.architecture) problems.push(...architectureProblems(path, doc));
    else if (path.startsWith(`${PATHS.specsDir}/`)) problems.push(...specProblems(path, doc));
    else if (path.startsWith(`${PATHS.adrDir}/`)) problems.push(...adrProblems(path, doc));
  }
  for (const path of [...view.living.docs.keys(), PATHS.roadmap]) {
    const text = view.snapshot.get(path);
    if (text === undefined) continue;
    for (const id of findIds(text)) {
      if (!view.living.elements.has(id)) problems.push(error(path, lineOf(text, id), "unknown-id", `${id} is cited but not defined in the living docs`));
    }
  }
  return problems;
}

/** A heading shaped like `<KIND>-...: Title` whose ID breaks the grammar. */
export function malformedIdHeadings(path: string, doc: MarkdownDoc): Problem[] {
  return doc.headings.flatMap((heading) => {
    const match = /^(?:(?:ADDED|MODIFIED|REMOVED) )?([A-Z]{2,5}-\S*):\s/.exec(heading.text);
    if (match?.[1] === undefined || findIds(match[1])[0] === match[1]) return [];
    return [error(path, heading.line, "malformed-id", `"${match[1]}" is not a valid ID`)];
  });
}

function architectureProblems(path: string, doc: MarkdownDoc): Problem[] {
  const problems: Problem[] = [];
  for (const element of headingElements(doc)) {
    const section = [...doc.headings].reverse().find((h) => h.level === 2 && h.line < element.start);
    if (!ARCHITECTURE_KINDS.includes(element.kind)) {
      problems.push(error(path, element.start, "misplaced-element", `${element.id} does not belong in the architecture`));
    } else if (element.kind !== "VIEW" && section?.text !== sectionForKind(element.kind)) {
      problems.push(error(path, element.start, "misplaced-element", `${element.id} belongs under "## ${sectionForKind(element.kind)}"`));
    }
    problems.push(...elementProblems(path, doc, element), ...statusProblems(path, doc, element));
  }
  return problems;
}

function specProblems(path: string, doc: MarkdownDoc): Problem[] {
  const capability = path.slice(path.lastIndexOf("/") + 1, -".md".length);
  const problems: Problem[] = [];
  const elements = headingElements(doc);
  for (const element of elements) {
    const expectedLevel = element.kind === "REQ" ? 2 : element.kind === "SCN" ? 3 : 0;
    if (expectedLevel === 0) problems.push(error(path, element.start, "misplaced-element", `${element.id} does not belong in a spec`));
    else if (element.level !== expectedLevel) problems.push(error(path, element.start, "heading-level", `${element.id} must be a level ${expectedLevel} heading`));
    if (scopeOf(element.id) !== undefined && scopeOf(element.id) !== capability) {
      problems.push(error(path, element.start, "id-scope", `${element.id} must use the scope "${capability}", the capability of this file`));
    }
    problems.push(...elementProblems(path, doc, element), ...statusProblems(path, doc, element));
  }
  return problems;
}

function adrProblems(path: string, doc: MarkdownDoc): Problem[] {
  const text = doc.lines.join("\n");
  return ["Status", "Date"]
    .filter((key) => !new RegExp(`^- ${key}: `, "m").test(text))
    .map((key) => error(path, undefined, "adr-fact", `the ADR is missing "- ${key}:"`));
}

function statusProblems(path: string, doc: MarkdownDoc, element: Element): Problem[] {
  const status = statusOf(doc, element);
  if (STATUS_KINDS.includes(element.kind) && status === undefined) {
    return [warning(path, element.start, "missing-status", `${element.id} has no status yet; approving the document adds it`)];
  }
  if (!STATUS_KINDS.includes(element.kind) && status !== undefined) {
    return [error(path, element.start, "unexpected-status", `${element.id} is not a kind that carries a status`)];
  }
  return [];
}

export function lineOf(text: string, needle: string): number | undefined {
  const index = text.indexOf(needle);
  return index === -1 ? undefined : text.slice(0, index).split("\n").length - 1;
}
