import { featureOfScenario } from "../ids.ts";
import { findSection, type MarkdownDoc } from "../markdown.ts";
import { FEATURE_SECTIONS, FEATURE_STATUSES, statusLine, strayScenarioIds, type Feature } from "../project/features.ts";
import { PATHS } from "../project/layout.ts";
import type { ProjectDocs } from "../project/project_docs.ts";
import { error, warning, type Problem } from "./problem.ts";

/** Each document's required sections, its size, its scenarios, and leftover template guides. */

const VISION_SECTIONS = ["Problem", "Users", "Release"];
const ARCHITECTURE_SECTIONS = ["Overview", "Ports", "Adapters", "Runtime"];

/** Words past which a document stops being something a person reads in one sitting. */
export const WORD_LIMITS = { vision: 1500, architecture: 3000, feature: 2500 } as const;

const GUIDE = /(?<!`)<(?!!--|\/|https?:|br\b)[A-Za-z][^<>\n]*>(?!`)/;
const PLACEHOLDER = /\{\{[a-z_]+\}\}/;

export function documentProblems(docs: ProjectDocs): Problem[] {
  const problems: Problem[] = [];
  if (docs.vision !== undefined) problems.push(...shapeOf(PATHS.vision, docs.vision, VISION_SECTIONS, WORD_LIMITS.vision));
  if (docs.architecture !== undefined) problems.push(...shapeOf(PATHS.architecture, docs.architecture, ARCHITECTURE_SECTIONS, WORD_LIMITS.architecture));
  for (const feature of docs.features) {
    problems.push(...shapeOf(feature.path, feature.doc, [...FEATURE_SECTIONS], WORD_LIMITS.feature), ...featureProblems(feature));
  }
  problems.push(...duplicateScenarios(docs.features));
  return problems;
}

function shapeOf(path: string, doc: MarkdownDoc, sections: string[], limit: number): Problem[] {
  const problems: Problem[] = sections.filter((title) => findSection(doc, title) === null).map((title) => error(path, undefined, "missing-section", `needs a ## ${title} section`));
  const words = doc.lines.filter((_, i) => !doc.inFence[i]).join(" ").split(/\s+/).filter((w) => w !== "").length;
  if (words > limit) problems.push(warning(path, undefined, "too-long", `${words} words, over the ${limit} a person reads in one sitting; cut what the agent decided and the user needn't read, or split it`));
  doc.lines.forEach((line, i) => {
    if (doc.inFence[i]) return;
    const withoutCode = line.replace(/`[^`]*`/g, "");
    if (GUIDE.test(withoutCode) || PLACEHOLDER.test(withoutCode)) problems.push(error(path, i, "template-leftover", "replace the template guide or placeholder on this line"));
  });
  return problems;
}

function featureProblems(feature: Feature): Problem[] {
  const problems: Problem[] = [];
  const status = statusLine(feature.doc);
  if (status === undefined) problems.push(error(feature.path, undefined, "status", `needs a "- Status: shaped" line under the title`));
  else if (feature.status === undefined) problems.push(error(feature.path, status.line, "status", `the status is one of ${FEATURE_STATUSES.join(" or ")}`));
  if (feature.scenarios.length === 0 && findSection(feature.doc, "Behaviour") !== null) {
    problems.push(error(feature.path, undefined, "no-scenarios", `## Behaviour needs at least one ### SCN-${feature.slug}.<name>: <title> scenario`));
  }
  for (const scenario of feature.scenarios) {
    if (featureOfScenario(scenario.id) !== feature.slug) problems.push(error(feature.path, scenario.line, "scenario-id", `${scenario.id} belongs to this feature, so it starts SCN-${feature.slug}.`));
  }
  for (const stray of strayScenarioIds(feature)) {
    problems.push(error(feature.path, stray.line, "scenario-heading", `a scenario heading reads exactly "${stray.id}: <title>"`));
  }
  return problems;
}

function duplicateScenarios(features: Feature[]): Problem[] {
  const seen = new Map<string, string>();
  const problems: Problem[] = [];
  for (const feature of features) {
    for (const scenario of feature.scenarios) {
      const first = seen.get(scenario.id);
      if (first !== undefined) problems.push(error(feature.path, scenario.line, "duplicate-scenario", `${scenario.id} is already defined in ${first}`));
      else seen.set(scenario.id, feature.path);
    }
  }
  return problems;
}
