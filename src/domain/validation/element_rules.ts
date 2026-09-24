import { factsOf, type Element } from "../elements.ts";
import { findIds, scopeOf, SCOPED_KINDS, type Kind } from "../ids.ts";
import type { MarkdownDoc } from "../markdown.ts";
import { error, type Problem } from "./problem.ts";

/** Rules for a single element's body, shared by living documents and deltas. */

const REQUIRED_FACTS: Partial<Record<Kind, string[]>> = {
  CTX: ["Purpose"],
  ENT: ["Kind", "Module", "File"],
  UC: ["Input", "Output", "Errors", "Uses", "Module", "File"],
  PORT: ["Direction", "Operations", "Module", "File"],
  ADP: ["Technology", "Module", "File"],
  FLOW: ["Elements"],
  MOD: ["Path", "Layer"],
};

const ALLOWED_VALUES: Record<string, { kinds: Kind[]; values: string[] }> = {
  Kind: { kinds: ["ENT"], values: ["aggregate", "entity", "value", "service", "policy", "event"] },
  Direction: { kinds: ["PORT"], values: ["driven", "driving"] },
  Layer: { kinds: ["MOD"], values: ["domain", "application", "adapter", "composition"] },
};

export function elementProblems(path: string, doc: MarkdownDoc, element: Element): Problem[] {
  const problems: Problem[] = [];
  if (SCOPED_KINDS.includes(element.kind) && scopeOf(element.id) === undefined) {
    problems.push(error(path, element.start, "id-scope", `${element.id} needs a scope: ${element.kind}-<scope>.<name>`));
  }
  if (element.op === "REMOVED") return [...problems, ...removedProblems(path, doc, element)];

  const facts = factsOf(doc, element);
  for (const key of REQUIRED_FACTS[element.kind] ?? []) {
    if (!facts.has(key)) problems.push(error(path, element.start, "required-fact", `${element.id} is missing "- ${key}:"`));
  }
  if (element.kind === "ADP" && !facts.has("Implements") && !facts.has("Drives")) {
    problems.push(error(path, element.start, "required-fact", `${element.id} needs "- Implements:" or "- Drives:"`));
  }
  for (const [key, rule] of Object.entries(ALLOWED_VALUES)) {
    const value = facts.get(key)?.[0];
    if (rule.kinds.includes(element.kind) && value !== undefined && !rule.values.includes(value)) {
      problems.push(error(path, element.start, "fact-value", `${element.id} ${key} must be one of ${rule.values.join(", ")}`));
    }
  }
  const module = facts.get("Module")?.[0];
  if (module !== undefined && !findIds(module).some((id) => id.startsWith("MOD-"))) {
    problems.push(error(path, element.start, "fact-value", `${element.id} Module must name a MOD element`));
  }
  if (element.kind === "FLOW" && !bodyText(doc, element).includes("sequenceDiagram")) {
    problems.push(error(path, element.start, "flow-diagram", `${element.id} needs a Mermaid sequenceDiagram`));
  }
  if (element.kind === "REQ") problems.push(...requirementProblems(path, doc, element));
  if (element.kind === "SCN") problems.push(...scenarioProblems(path, doc, element));
  return problems;
}

function removedProblems(path: string, doc: MarkdownDoc, element: Element): Problem[] {
  const facts = factsOf(doc, element);
  const problems: Problem[] = [];
  if (!facts.has("Reason")) problems.push(error(path, element.start, "removed-reason", `REMOVED ${element.id} needs "- Reason:"`));
  if (element.kind === "REQ" && !facts.has("Migration")) {
    problems.push(error(path, element.start, "removed-reason", `REMOVED ${element.id} needs "- Migration:"`));
  }
  return problems;
}

function requirementProblems(path: string, doc: MarkdownDoc, element: Element): Problem[] {
  const problems: Problem[] = [];
  const ownBody = ownLines(doc, element).join("\n");
  if (!/\b(SHALL|MUST)\b/.test(ownBody)) problems.push(error(path, element.start, "req-keyword", `${element.id} must state SHALL or MUST`));
  const hasScenario = doc.headings.some((h) => h.line > element.start && h.line < element.end && h.level === element.level + 1 && h.text.startsWith("SCN-"));
  if (!hasScenario) problems.push(error(path, element.start, "req-scenario", `${element.id} needs at least one scenario`));
  return problems;
}

function scenarioProblems(path: string, doc: MarkdownDoc, element: Element): Problem[] {
  const steps = ownLines(doc, element)
    .map((line) => /^- (GIVEN|WHEN|THEN|AND) /.exec(line)?.[1])
    .filter((step) => step !== undefined);
  const order = steps.filter((step) => step !== "AND").join(" ");
  if (!/^(GIVEN )*WHEN( THEN)+$/.test(order)) {
    return [error(path, element.start, "scenario-steps", `${element.id} needs GIVEN steps (optional), one WHEN, then one or more THEN`)];
  }
  if (steps[0] === "AND") return [error(path, element.start, "scenario-steps", `${element.id} cannot start with AND`)];
  return [];
}

/** The element's lines before its first nested heading, without the heading itself. */
function ownLines(doc: MarkdownDoc, element: Element): string[] {
  const lines: string[] = [];
  for (let i = element.start + 1; i < element.end; i++) {
    if (!doc.inFence[i] && /^#{1,6} /.test(doc.lines[i] ?? "")) break;
    lines.push(doc.lines[i] ?? "");
  }
  return lines;
}

function bodyText(doc: MarkdownDoc, element: Element): string {
  return doc.lines.slice(element.start, element.end).join("\n");
}
