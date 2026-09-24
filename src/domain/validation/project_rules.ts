import { factsOf } from "../elements.ts";
import { matchesAny } from "../glob.ts";
import { findIds } from "../ids.ts";
import { parseMarkdown, type MarkdownDoc } from "../markdown.ts";
import { tablesIn } from "../markdown_tables.ts";
import { PATHS } from "../project/layout.ts";
import type { ProjectView } from "../project/project_view.ts";
import { error, warning, type Problem } from "./problem.ts";

/** Rules that span the project: leftover template guides, the roadmap and the config. */

const GUIDE = /(?<!`)<(?!!--|\/|https?:|br\b)[A-Za-z][^<>\n]*>(?!`)/;
const PLACEHOLDER = /\{\{[a-z_]+\}\}/;

/** Unfilled `<guides>` and `{{placeholders}}` outside code, in living docs and active work. */
export function templateLeftovers(view: ProjectView): Problem[] {
  const paths = [...view.living.docs.keys(), PATHS.roadmap, PATHS.glossary, ...view.items.filter((i) => !i.archived).map((i) => i.path)];
  return paths.flatMap((path) => {
    const text = view.snapshot.get(path);
    if (text === undefined) return [];
    const doc = parseMarkdown(text);
    return doc.lines.flatMap((line, i) => {
      if (doc.inFence[i]) return [];
      const withoutCode = line.replace(/`[^`]*`/g, "");
      if (GUIDE.test(withoutCode) || PLACEHOLDER.test(withoutCode)) {
        return [error(path, i, "template-leftover", "replace the template guide or placeholder on this line")];
      }
      return [];
    });
  });
}

export function roadmapProblems(view: ProjectView): Problem[] {
  const text = view.snapshot.get(PATHS.roadmap);
  if (text === undefined) return [];
  const doc = parseMarkdown(text);
  const problems: Problem[] = [];
  const items = new Map<string, { blockedBy: string[]; line: number }>();
  const phases = doc.headings.filter((h) => h.level === 3 && /^Phase \d+: /.test(h.text));
  for (const phase of phases) {
    const end = doc.headings.find((h) => h.line > phase.line && h.level <= 3)?.line ?? doc.lines.length;
    for (const table of tablesIn(doc.lines, doc.inFence, phase.line + 1, end)) {
      for (const { cells, line } of table.rows) {
        const [item = "", kind = "", , blocked = ""] = cells;
        if (items.has(item)) problems.push(error(PATHS.roadmap, line, "roadmap-item", `item ${item} appears twice`));
        if (!["feature", "change"].includes(kind)) problems.push(error(PATHS.roadmap, line, "roadmap-item", `item ${item} kind must be feature or change`));
        items.set(item, { blockedBy: blocked.split(",").map((s) => s.trim()).filter((s) => s !== ""), line });
      }
    }
  }
  for (const [item, { blockedBy, line }] of items) {
    for (const blocker of blockedBy.filter((b) => !items.has(b))) problems.push(error(PATHS.roadmap, line, "roadmap-blocker", `${item} is blocked by unknown item ${blocker}`));
  }
  const cycle = findCycle(items);
  if (cycle !== null) problems.push(error(PATHS.roadmap, undefined, "roadmap-cycle", `blocking cycle: ${cycle.join(" -> ")}`));
  const coverage = doc.lines.join("\n").split(/^## Coverage$/m)[1] ?? "";
  for (const goal of [...view.living.elements.keys()].filter((id) => id.startsWith("GOAL-"))) {
    if (!findIds(coverage).includes(goal)) problems.push(warning(PATHS.roadmap, undefined, "goal-uncovered", `${goal} has no items in the coverage table`));
  }
  return problems;
}

function findCycle(items: Map<string, { blockedBy: string[] }>): string[] | null {
  const state = new Map<string, "visiting" | "done">();
  const visit = (item: string, path: string[]): string[] | null => {
    if (state.get(item) === "done") return null;
    if (state.get(item) === "visiting") return [...path.slice(path.indexOf(item)), item];
    state.set(item, "visiting");
    for (const next of items.get(item)?.blockedBy ?? []) {
      const found = visit(next, [...path, item]);
      if (found !== null) return found;
    }
    state.set(item, "done");
    return null;
  };
  for (const item of items.keys()) {
    const found = visit(item, []);
    if (found !== null) return found;
  }
  return null;
}

export function configProblems(view: ProjectView): Problem[] {
  if (view.config === null) return [error(PATHS.config, undefined, "config-missing", "the project has no .cruze/config.yaml; run cruze init")];
  const problems = view.config.problems.map((message) => error(PATHS.config, undefined, "config", message));
  const config = view.config.config;
  const architecture = view.living.docs.get(PATHS.architecture);
  if (config === null || architecture === undefined || config.layers.length === 0) return problems;
  for (const { element } of [...view.living.elements.values()].filter((e) => e.id.startsWith("MOD-"))) {
    for (const path of modulePaths(architecture, element)) {
      const probe = path.endsWith("/") ? `${path}probe.file` : path;
      const layers = config.layers.filter((layer) => matchesAny(probe, layer.paths));
      if (layers.length !== 1) {
        problems.push(warning(PATHS.config, undefined, "module-layer", `${element.id} path ${path} falls in ${layers.length} layers; it should fall in exactly one`));
      }
    }
  }
  return problems;
}

function modulePaths(doc: MarkdownDoc, element: Parameters<typeof factsOf>[1]): string[] {
  return (factsOf(doc, element).get("Path") ?? []).flatMap((value) => [...value.matchAll(/`([^`]+)`/g)].map((m) => m[1] ?? ""));
}
