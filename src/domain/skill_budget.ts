import type { SkillFiles } from "./skill_links.ts";

/**
 * The words one instruction file may hold. A longer file holds material only some runs need, so it
 * splits by branch, as `docs/contributing/writing-skills.md` says, and each run reads only its part.
 */
export const MAX_FILE_WORDS = 2100;

/**
 * The words agents may read across the whole bundle. By 0.0.13 the skills had grown to 45,800 words
 * as every fix added rules and nothing was removed; 0.0.14 cut them to this. Lower it when text is
 * cut. Raising it is the maintainer's decision, with the reason in the commit that raises it.
 */
export const BUNDLE_WORD_BUDGET = 20920;

/** Data the CLI reads or renders, rather than instructions an agent reads. */
const NOT_INSTRUCTIONS = /(^|\/)(templates|notes)\//;

export function wordCount(text: string): number {
  return text.split(/\s+/).filter((word) => word !== "").length;
}

/** Instruction files over their limit, and the bundle when it is over its budget. */
export function budgetProblems(skills: SkillFiles[]): string[] {
  const files = skills.flatMap((skill) =>
    skill.files.filter((f) => f.path.endsWith(".md") && !NOT_INSTRUCTIONS.test(f.path)).map((f) => ({ path: `${skill.folder}/${f.path}`, words: wordCount(f.text) })),
  );
  const problems = files
    .filter((f) => f.words > MAX_FILE_WORDS)
    .map((f) => `${f.path}: ${f.words} words, over ${MAX_FILE_WORDS}; move what only some runs need into a sibling file`);
  const total = files.reduce((sum, f) => sum + f.words, 0);
  if (total > BUNDLE_WORD_BUDGET) {
    problems.push(`the skills hold ${total} words, over the budget of ${BUNDLE_WORD_BUDGET}; cut or merge text to make room, or raise the budget with the reason in the commit`);
  }
  return problems;
}
