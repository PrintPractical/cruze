/** Element IDs: `<KIND>-<name>` or `<KIND>-<scope>.<name>`, named and never reused. */

export const KINDS = ["GOAL", "CTX", "ENT", "UC", "PORT", "ADP", "FLOW", "MOD", "RULE", "VIEW", "XC", "REQ", "SCN", "ADR"] as const;
export type Kind = (typeof KINDS)[number];

/** Kinds that describe code, and so carry a managed planned/built status. */
export const CODE_KINDS: readonly Kind[] = ["ENT", "UC", "PORT", "ADP", "FLOW", "MOD"];
/** Kinds whose elements carry a managed status: code kinds and scenarios. */
export const STATUS_KINDS: readonly Kind[] = [...CODE_KINDS, "SCN"];
/** Kinds that must name their context or capability as a scope. */
export const SCOPED_KINDS: readonly Kind[] = ["ENT", "UC", "PORT", "ADP", "FLOW", "REQ", "SCN"];

const WORD = "[a-z0-9]+(?:-[a-z0-9]+)*";
export const ID_PATTERN = `(?:${KINDS.join("|")})-${WORD}(?:\\.${WORD})?`;

const EXACT = new RegExp(`^${ID_PATTERN}$`);
const ANYWHERE = new RegExp(`(?<![A-Za-z0-9_-])${ID_PATTERN}(?![A-Za-z0-9_-])`, "g");

export function isId(text: string): boolean {
  return EXACT.test(text);
}

export function kindOf(id: string): Kind {
  return id.slice(0, id.indexOf("-")) as Kind;
}

/** The context or capability an ID belongs to, if it has one. */
export function scopeOf(id: string): string | undefined {
  const rest = id.slice(id.indexOf("-") + 1);
  const dot = rest.indexOf(".");
  return dot === -1 ? undefined : rest.slice(0, dot);
}

/** Every ID mentioned in the text, once each, in order of first mention. */
export function findIds(text: string): string[] {
  return [...new Set(text.match(ANYWHERE) ?? [])];
}
