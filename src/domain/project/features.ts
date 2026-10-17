import { isStatusLine } from "../hashing.ts";
import { findScenarioIds, isScenarioId } from "../ids.ts";
import { findSection, parseMarkdown, type MarkdownDoc } from "../markdown.ts";
import { featurePath } from "./layout.ts";

/** A feature document, docs/features/<slug>.md: one slice of behaviour, its public API and its stack sketch. */
export interface Feature {
  slug: string;
  path: string;
  text: string;
  doc: MarkdownDoc;
  /** `shaped` until build finishes it, then `built`; undefined when the line is missing or unknown. */
  status: FeatureStatus | undefined;
  /** The scenarios under `## Behaviour`, by heading `### SCN-<slug>.<name>: <title>`. */
  scenarios: Scenario[];
}

export type FeatureStatus = "shaped" | "built";
export const FEATURE_STATUSES: readonly FeatureStatus[] = ["shaped", "built"];

export interface Scenario {
  id: string;
  title: string;
  /** 0-based line of its heading. */
  line: number;
}

export const FEATURE_SECTIONS = ["Intent", "Behaviour", "Public API", "Stack sketch", "Decisions"] as const;

export function readFeature(slug: string, text: string): Feature {
  const doc = parseMarkdown(text);
  return { slug, path: featurePath(slug), text, doc, status: statusOf(doc), scenarios: scenariosOf(doc) };
}

/** The feature's `- Status:` line, the first one outside code. */
export function statusLine(doc: MarkdownDoc): { line: number; value: string } | undefined {
  const index = doc.lines.findIndex((line, i) => !doc.inFence[i] && isStatusLine(line));
  if (index === -1) return undefined;
  return { line: index, value: (doc.lines[index] ?? "").replace("- Status:", "").trim() };
}

function statusOf(doc: MarkdownDoc): FeatureStatus | undefined {
  const value = statusLine(doc)?.value;
  return (FEATURE_STATUSES as readonly string[]).includes(value ?? "") ? (value as FeatureStatus) : undefined;
}

/** Scenario headings under `## Behaviour`: any heading whose text starts with a scenario ID and a colon. */
function scenariosOf(doc: MarkdownDoc): Scenario[] {
  const section = findSection(doc, "Behaviour");
  if (section === null) return [];
  return doc.headings
    .filter((h) => h.line >= section.start && h.line < section.end)
    .flatMap((h) => {
      const match = /^(\S+): (.+)$/.exec(h.text);
      if (match?.[1] === undefined || match[2] === undefined || !isScenarioId(match[1])) return [];
      return [{ id: match[1], title: match[2], line: h.line }];
    });
}

/** Scenario-like IDs under `## Behaviour` that aren't a proper scenario heading, for validate to report. */
export function strayScenarioIds(feature: Feature): Array<{ id: string; line: number }> {
  const section = findSection(feature.doc, "Behaviour");
  if (section === null) return [];
  const headed = new Set(feature.scenarios.map((s) => s.line));
  const stray: Array<{ id: string; line: number }> = [];
  for (let i = section.start; i < section.end; i++) {
    if (headed.has(i) || feature.doc.inFence[i] || !/^#{1,6} /.test(feature.doc.lines[i] ?? "")) continue;
    for (const id of findScenarioIds(feature.doc.lines[i] ?? "")) stray.push({ id, line: i });
  }
  return stray;
}
