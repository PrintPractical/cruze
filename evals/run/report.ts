/** The report of a run over eval cases: one result per case and the tallies. */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

export type CaseStatus = "pass" | "fail" | "manual" | "error";

export interface CaseResult {
  path: string;
  status: CaseStatus;
  /** The grader's reason for a fail, or what went wrong for an error. */
  reason?: string;
  /** The kept copy of the fixture, for a failed or errored case or with `--keep`. */
  workdir?: string;
}

export interface RunReport {
  cases: CaseResult[];
  passed: number;
  failed: number;
  manual: number;
  errors: number;
}

export function runReport(cases: CaseResult[]): RunReport {
  const count = (status: CaseStatus) => cases.filter((result) => result.status === status).length;
  return { cases, passed: count("pass"), failed: count("fail"), manual: count("manual"), errors: count("error") };
}

/** Nothing failed or errored; manual cases don't count against a run. */
export function allGood(report: RunReport): boolean {
  return report.failed === 0 && report.errors === 0;
}

export function writeReport(report: RunReport, out?: string): void {
  const text = `${JSON.stringify(report, null, 2)}\n`;
  process.stdout.write(text);
  if (out === undefined) return;
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, text);
}
