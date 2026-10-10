/**
 * Graded runs of eval cases: each case's `## Run` prompt goes to a headless agent on a
 * fresh copy of the fixture project, and a second headless run grades the result against
 * the case's Expected and Check sections.
 *
 *   node evals/run.ts [case files or directories...] [--agent <command>] [--fixture <dir>] [--out <report.json>] [--keep]
 *
 * Prints a JSON report and exits 1 when a case failed or errored. A case without a
 * `## Run` section is reported as manual. Progress goes to stderr.
 */
import { fileURLToPath } from "node:url";
import { parseOptions, USAGE, type RunOptions } from "./run/options.ts";
import { allGood, runReport, writeReport } from "./run/report.ts";
import { runCase } from "./run/run_case.ts";

const repoRoot = fileURLToPath(new URL("..", import.meta.url));

let options: RunOptions;
try {
  options = parseOptions(process.argv.slice(2), repoRoot);
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n${USAGE}\n`);
  process.exit(2);
}

const note = (message: string) => process.stderr.write(`${message}\n`);
const results = options.cases.map((path) => runCase(path, { ...options, repoRoot, note }));
const report = runReport(results);
writeReport(report, options.out);
process.exit(allGood(report) ? 0 : 1);
