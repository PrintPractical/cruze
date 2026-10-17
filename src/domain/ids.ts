/** Scenario IDs: `SCN-<feature>.<name>`, lowercase words joined by single hyphens, named and never reused. */

const WORD = "[a-z0-9]+(?:-[a-z0-9]+)*";
export const SLUG = new RegExp(`^${WORD}$`);
const SCENARIO = `SCN-${WORD}\\.${WORD}`;
const EXACT = new RegExp(`^${SCENARIO}$`);
const ANYWHERE = new RegExp(`(?<![A-Za-z0-9_-])${SCENARIO}(?![A-Za-z0-9_.-])`, "g");

export function isScenarioId(text: string): boolean {
  return EXACT.test(text);
}

export function isSlug(text: string): boolean {
  return SLUG.test(text);
}

/** The feature a scenario belongs to. */
export function featureOfScenario(id: string): string {
  return id.slice(4, id.indexOf("."));
}

/** Every scenario ID mentioned in the text, once each, in order of first mention. */
export function findScenarioIds(text: string): string[] {
  return [...new Set(text.match(ANYWHERE) ?? [])];
}
