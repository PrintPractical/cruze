/**
 * Settled decisions are numbered `D<n>` within the document that records them: the architecture's
 * `## Decisions`, or one feature or change, which is archived when it finishes. A number cited
 * anywhere else either dangles or silently means another document's decision.
 */

/** One citation of decisions by number, such as `D5`, `D5, D19` or `events D17`. */
export interface DecisionCitation {
  /** 0-based line. */
  line: number;
  text: string;
  numbers: number[];
  /** The work item named with it, as in `events D17` or `D1 of 02-links`. */
  qualifier?: string;
}

const SLUG = "[a-z0-9]+(?:-[a-z0-9]+)*";
const CITATION = new RegExp(`(?:(?<![\\w-])(${SLUG})\\s+)?(?<![\\w-])(D\\d+(?:\\s*(?:,|and)\\s*D\\d+)*)(?![\\w-])(?:\\s+of\\s+(${SLUG}))?`, "g");
const DEFINITION = /^\s*- D(\d+):/;

/**
 * Every citation of decisions by number in the lines given, skipping the `- D<n>:` that defines one
 * and anything inside backticks. `slugs` are the work items a citation may name.
 */
export function findDecisionCitations(lines: readonly string[], slugs: ReadonlySet<string>, skip: (line: number) => boolean = () => false): DecisionCitation[] {
  const citations: DecisionCitation[] = [];
  lines.forEach((raw, line) => {
    if (skip(line)) return;
    const text = raw.replace(DEFINITION, (m) => " ".repeat(m.length)).replace(/`[^`]*`/g, (m) => " ".repeat(m.length));
    for (const match of text.matchAll(CITATION)) {
      const before = match[1] !== undefined && slugs.has(match[1]) ? match[1] : undefined;
      const after = match[3] !== undefined && slugs.has(match[3]) ? match[3] : undefined;
      const numbers = [...(match[2] ?? "").matchAll(/D(\d+)/g)].map((m) => Number(m[1]));
      const qualifier = before ?? after;
      const cited = qualifier === undefined ? (match[2] ?? "") : (match[0] ?? "").trim();
      citations.push(qualifier === undefined ? { line, text: cited, numbers } : { line, text: cited, numbers, qualifier });
    }
  });
  return citations;
}

/** The decisions a `## Decisions` section, or any lines, define as `- D<n>: ...`. */
export function definedDecisions(lines: readonly string[]): Set<number> {
  return new Set(lines.flatMap((line) => {
    const match = DEFINITION.exec(line);
    return match?.[1] === undefined ? [] : [Number(match[1])];
  }));
}

/**
 * The names a citation may give a work item: a feature's slug with and without its date, and a
 * change's folder name, such as `events`, `2026-10-08-events` and `02-links`.
 */
export function workItemSlugs(folderNames: Iterable<string>): Set<string> {
  const slugs = new Set<string>();
  for (const name of folderNames) {
    slugs.add(name);
    const undated = name.replace(/^\d{4}-\d{2}-\d{2}-/, "");
    if (undated !== "") slugs.add(undated);
  }
  return slugs;
}
