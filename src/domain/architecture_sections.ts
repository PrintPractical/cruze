import type { Kind } from "./ids.ts";

/** The `##` sections of architecture.md, in order, and the element kind each holds. */
export const ARCHITECTURE_SECTIONS: ReadonlyArray<{ title: string; kind: Kind | null }> = [
  { title: "Overview", kind: "VIEW" },
  { title: "Bounded contexts", kind: "CTX" },
  { title: "Domain model", kind: "ENT" },
  { title: "Use cases", kind: "UC" },
  { title: "Ports", kind: "PORT" },
  { title: "Adapters", kind: "ADP" },
  { title: "Flows", kind: "FLOW" },
  { title: "Modules", kind: "MOD" },
  { title: "Dependency rules", kind: "RULE" },
  { title: "Cross-cutting concerns", kind: "XC" },
  { title: "Decisions", kind: null },
];

export const ARCHITECTURE_KINDS: readonly Kind[] = ["VIEW", "CTX", "ENT", "UC", "PORT", "ADP", "FLOW", "MOD", "RULE", "XC"];
export const SPEC_KINDS: readonly Kind[] = ["REQ", "SCN"];

export function sectionForKind(kind: Kind): string | undefined {
  return ARCHITECTURE_SECTIONS.find((section) => section.kind === kind)?.title;
}
