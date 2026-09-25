import { checkCode, traceTests } from "../../../../app/use_cases/check_code.ts";
import { landChange } from "../../../../app/use_cases/land_change.ts";
import type { CliContext, CommandResult, Options } from "../cli_context.ts";

export async function runCheck(context: CliContext, args: string[], options: Options): Promise<CommandResult> {
  const files = [...options.file, ...args];
  const report = await checkCode(context, { ci: options.ci, ...(files.length === 0 ? {} : { files }) });
  const lines = report.findings.map((f) => `${f.severity} ${f.path}${f.line === undefined ? "" : `:${f.line}`} ${f.message} [${f.rule}]`);
  lines.push(`Checked ${report.checked} file(s): ${report.passed ? "passed" : "failed"}.`);
  return { json: report, human: lines.join("\n"), failed: !report.passed };
}

export async function runTrace(context: CliContext, _args: string[], options: Options): Promise<CommandResult> {
  const report = await traceTests(context, { all: options.all, ...(options.change === undefined ? {} : { change: options.change }) });
  const lines = report.missing.map((id) => `missing test for ${id}`);
  lines.push(...report.unknown.map((u) => `${u.path}:${u.line} cites ${u.id}, which no spec or delta defines`));
  lines.push(`Traced ${report.scenarios.length} scenario(s) for ${report.scope}: ${report.passed ? "passed" : "failed"}.`);
  return { json: report, human: lines.join("\n"), failed: !report.passed };
}

export async function runLand(context: CliContext, args: string[], options: Options): Promise<CommandResult> {
  const report = await landChange(context, args[0], options.override === undefined ? {} : { override: options.override });
  const lines = [`Landed ${report.change}.`];
  if (report.merged.length > 0) lines.push(`Merged into the living docs: ${report.merged.join(", ")}`);
  if (report.built.length > 0) lines.push(`Now built: ${report.built.join(", ")}`);
  if (report.removed.length > 0) lines.push(`Removed: ${report.removed.join(", ")}`);
  if (report.restamped.length > 0) lines.push(`Re-stamped approvals: ${report.restamped.join(", ")}`);
  if (report.archivedTo !== undefined) lines.push(`Finished; archived to ${report.archivedTo}.`);
  return { json: report, human: lines.join("\n") };
}
