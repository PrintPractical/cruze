import { checkSource, type CheckFinding } from "../../domain/check/check_source.ts";
import { CruzeError } from "../../domain/cruze_error.ts";
import { matchesAny } from "../../domain/glob.ts";
import { traceScenarios, type TraceReport } from "../../domain/trace.ts";
import { loadDocs, requireConfig, type ProjectDeps } from "../project_context.ts";
import type { ProjectFiles } from "../ports/project_files.ts";

export interface CheckReport {
  passed: boolean;
  checked: number;
  findings: CheckFinding[];
}

/** Enforces layer rules and file budgets. Layer violations always fail; budget warnings fail only with `ci`. */
export async function checkCode(deps: ProjectDeps, options: { files?: string[]; ci: boolean }): Promise<CheckReport> {
  const config = requireConfig(await loadDocs(deps.files));
  const sources = await readMatching(deps.files, config.source);
  for (const file of options.files ?? []) {
    if (sources.has(file) || !matchesAny(file, config.source)) continue;
    const text = await deps.files.readText(file);
    if (text === undefined) throw new CruzeError("not-found", `${file} does not exist`);
    sources.set(file, text);
  }
  const only = options.files?.filter((file) => sources.has(file));
  const findings = checkSource({ config, sources, ...(only === undefined ? {} : { only }) });
  const failing = findings.filter((f) => f.severity === "error" || options.ci);
  return { passed: failing.length === 0, checked: only?.length ?? sources.size, findings };
}

export interface TraceResult extends TraceReport {
  passed: boolean;
  scope: string;
}

/** Scenario-to-test traceability for one feature, or for every built feature. */
export async function traceTests(deps: ProjectDeps, slug?: string): Promise<TraceResult> {
  const docs = await loadDocs(deps.files);
  const config = requireConfig(docs);
  let required = docs.features.filter((f) => f.status === "built");
  if (slug !== undefined) {
    const feature = docs.features.find((f) => f.slug === slug);
    if (feature === undefined) throw new CruzeError("not-found", `no feature ${slug} in docs/features/`);
    required = [feature];
  }
  const report = traceScenarios(docs.features, required, await readMatching(deps.files, config.tests));
  return { ...report, passed: report.missing.length === 0 && report.unknown.length === 0, scope: slug ?? "every built feature" };
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
