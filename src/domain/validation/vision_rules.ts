import { rowElements } from "../elements.ts";
import { findSection } from "../markdown.ts";
import { splitRow } from "../markdown_tables.ts";
import { PATHS } from "../project/layout.ts";
import type { ProjectView } from "../project/project_view.ts";
import { error, type Problem } from "./problem.ts";

/** The section and the cells after the ID that each long-term row of the vision holds. */
const INTENT_ROWS: Record<string, { section: string; cells: string[] }> = {
  PRINCIPLE: { section: "Principles", cells: ["Principle", "Why"] },
  LATER: { section: "Must stay possible", cells: ["Capability", "Likelihood", "Why", "Leave room for"] },
};

export const LIKELIHOODS = ["likely", "possible"];

/**
 * The vision's principles and the capabilities that must stay possible are rows, so designs cite
 * them and approvals pin them. One project kept its principles in a seed note and its long-term
 * plans in the user's head: a feature reversed a principle unnoticed, and a later review proposed
 * removing what those plans needed.
 */
export function visionProblems(view: ProjectView): Problem[] {
  const doc = view.living.docs.get(PATHS.vision);
  if (doc === undefined) return [];
  return rowElements(doc).flatMap((row) => {
    const shape = INTENT_ROWS[row.kind];
    if (shape === undefined) return [];
    const section = findSection(doc, shape.section);
    if (section === null || row.start < section.start || row.start >= section.end) {
      return [error(PATHS.vision, row.start, "vision-row", `${row.id} belongs in the table under ## ${shape.section}`)];
    }
    const cells = splitRow(doc.lines[row.start] ?? "").slice(1);
    if (cells.length !== shape.cells.length || cells.some((cell) => cell === "")) {
      return [error(PATHS.vision, row.start, "vision-row", `${row.id} needs ${shape.cells.join(", ")}, each filled`)];
    }
    if (row.kind === "LATER" && !LIKELIHOODS.includes(cells[1] ?? "")) {
      return [error(PATHS.vision, row.start, "vision-row", `${row.id}'s likelihood must be ${LIKELIHOODS.join(" or ")}`)];
    }
    return [];
  });
}
