import { factsOf } from "../../domain/elements.ts";
import { checkSource, type CheckFinding } from "../../domain/check/check_source.ts";
import { CruzeError } from "../../domain/cruze_error.ts";
import { matchesAny } from "../../domain/glob.ts";
import { FIRST_RELEASE, isPending } from "../../domain/versions/rule_versions.ts";
import type { CruzeConfig } from "../../domain/config.ts";
import type { ProjectView } from "../../domain/project/project_view.ts";
import { resolveChange } from "../../domain/project/artifact_ref.ts";
import { readDelta } from "../../domain/project/deltas.ts";
import { activeChange } from "../../domain/status/work_status.ts";
import { traceScenarios, type TraceReport } from "../../domain/trace.ts";
import { loadView, type ProjectDeps } from "../project_context.ts";
import type { ProjectFiles } from "../ports/project_files.ts";

export interface CheckReport {
  passed: boolean;
  checked: number;
  findings: CheckFinding[];
}

/**
 * Enforces layer rules and file budgets. Layer violations always fail; budget and
 * module-map warnings fail only with `ci`. A rule newer than the project's `standards:`
 * is pending: it reports, but fails nothing until the project realigns.
 */
export async function checkCode(deps: ProjectDeps, options: { files?: string[]; ci: boolean }): Promise<CheckReport> {
  const view = await loadView(deps.files);
  const config = requireConfig(view);
  const sources = await readMatching(deps.files, config.source);
  for (const file of options.files ?? []) {
    if (!sources.has(file)) {
      const text = await deps.files.readText(file);
      if (text === undefined) throw new CruzeError("not-found", `${file} does not exist`);
      if (matchesAny(file, config.source)) sources.set(file, text);
    }
  }
  const only = options.files?.filter((file) => sources.has(file));
  const standards = config.standards ?? FIRST_RELEASE;
  const findings = checkSource({ config, sources, modulePaths: modulePaths(view), ...(only === undefined ? {} : { only }) }).map((f) =>
    isPending("check", f.rule, standards) ? { ...f, pending: true as const } : f,
  );
  const failing = findings.filter((f) => f.pending !== true && (f.severity === "error" || options.ci));
  return { passed: failing.length === 0, checked: only?.length ?? sources.size, findings };
}

export interface TraceResult extends TraceReport {
  passed: boolean;
  scope: string;
}

/** Scenario-to-test traceability for this branch's change, or for every built scenario with `all`. */
export async function traceTests(deps: ProjectDeps, options: { all: boolean; change?: string }): Promise<TraceResult> {
  const view = await loadView(deps.files);
  const config = requireConfig(view);
  let change;
  if (!options.all) {
    change = options.change !== undefined ? resolveChange(view, options.change) : activeChange(view, await deps.repository.currentBranch());
    if (change === undefined) throw new CruzeError("no-active-change", "no change is bound to this branch; name one with --change, or use --all");
  }
  const report = traceScenarios(view, await readMatching(deps.files, config.tests), change);
  return { ...report, passed: report.missing.length === 0 && report.unknown.length === 0, scope: change?.ref ?? "all built scenarios" };
}

function requireConfig(view: ProjectView): CruzeConfig {
  const config = view.config?.config;
  if (config === null || config === undefined) throw new CruzeError("config", "fix .cruze/config.yaml first; run cruze validate for details");
  return config;
}

/** Files matching any glob, read from the smallest directories that can contain them. */
async function readMatching(files: ProjectFiles, globs: string[]): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  const bases = [...new Set(globs.map(globBase))];
  for (const base of bases) {
    const listed = await files.listFiles(base === "" ? "." : base);
    for (const path of listed) {
      if (result.has(path) || !matchesAny(path, globs)) continue;
      const text = await files.readText(path);
      if (text !== undefined) result.set(path, text);
    }
  }
  return result;
}

/** The directory part of a glob before its first wildcard. */
function globBase(glob: string): string {
  const segments = glob.split("/");
  const fixed = segments.slice(0, segments.findIndex((s) => /[*?{]/.test(s)));
  return fixed.join("/");
}

/**
 * Every module's Path: the living docs' modules, and the modules that work in progress adds or
 * changes in its architecture delta, since their files are written before land merges them.
 */
function modulePaths(view: ProjectView): string[] {
  const living = [...view.living.elements.values()].filter((e) => e.id.startsWith("MOD-")).map((e) => ({ doc: e.doc, element: e.element }));
  const inFlight = view.items
    .filter((item) => item.kind !== "change" && !item.archived)
    .flatMap((item) => readDelta(item.doc).entries.filter((entry) => entry.element.id.startsWith("MOD-") && entry.element.op !== "REMOVED").map((entry) => ({ doc: item.doc, element: entry.element })));
  return [...living, ...inFlight].flatMap(({ doc, element }) => (factsOf(doc, element).get("Path") ?? []).flatMap((value) => [...value.matchAll(/`([^`]+)`/g)].map((m) => m[1] ?? "")));
}
