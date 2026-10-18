import { posix } from "node:path";
import { checkCode, traceTests } from "../../../../app/use_cases/check_code.ts";
import type { CliContext, CommandResult, Options } from "../cli_context.ts";

export async function runCheck(context: CliContext, args: string[], options: Options): Promise<CommandResult> {
  const files = args.map((file) => posix.normalize(posix.join(context.workingDirectory, file)));
  const report = await checkCode(context, { ci: options.ci, ...(files.length === 0 ? {} : { files }) });
  const lines = report.findings.map((f) => `${f.severity} ${f.path}${f.line === undefined ? "" : `:${f.line}`} ${f.message} [${f.rule}]`);
  lines.push(`Checked ${report.checked} file(s): ${report.passed ? "passed" : "failed"}.`);
  return { json: report, human: lines.join("\n"), failed: !report.passed };
}

export async function runTrace(context: CliContext, args: string[]): Promise<CommandResult> {
  const report = await traceTests(context, args[0]);
  const lines = report.missing.map((id) => `missing test for ${id}`);
  lines.push(...report.unknown.map((u) => `${u.path}:${u.line} cites ${u.id}, which no feature defines`));
  lines.push(`Traced ${report.scenarios.length} scenario(s) for ${report.scope}: ${report.passed ? "passed" : "failed"}.`);
  return { json: report, human: lines.join("\n"), failed: !report.passed };
}
