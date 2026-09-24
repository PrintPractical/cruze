import { approveArtifact } from "../../../../app/use_cases/approve_artifact.ts";
import { createWorkItem, type NewKind } from "../../../../app/use_cases/new_work_item.ts";
import { validate } from "../../../../app/use_cases/validate_project.ts";
import type { Problem } from "../../../../domain/validation/problem.ts";
import { UsageError, requireArgs, requireOption, type CliContext, type CommandResult, type Options } from "../cli_context.ts";

export async function runValidate(context: CliContext): Promise<CommandResult> {
  const report = await validate(context);
  const summary = report.problems.length === 0 ? "No problems." : `${report.errors} error(s), ${report.warnings} warning(s).`;
  return { json: report, human: [...report.problems.map(formatProblem), summary].join("\n"), failed: !report.valid };
}

export async function runApprove(context: CliContext, args: string[]): Promise<CommandResult> {
  requireArgs(args, ["document"]);
  const report = await approveArtifact(context, args[0] ?? "");
  const lines = [`Approved ${report.artifact} (${report.hash.slice(0, 19)}), pinned to ${report.upstream.length} upstream element(s).`];
  if (report.stamped.length > 0) lines.push(`Marked ${report.stamped.length} element(s) planned.`);
  if (report.bound !== undefined) lines.push(`Bound the change to branch ${report.bound}.`);
  return { json: report, human: lines.join("\n") };
}

export async function runNew(context: CliContext, args: string[], options: Options): Promise<CommandResult> {
  requireArgs(args, ["feature|change|adr", "slug"]);
  const kind = args[0] as NewKind;
  if (!["feature", "change", "adr"].includes(kind)) throw new UsageError(`cruze new takes feature, change or adr, not "${args[0]}"`);
  const report = await createWorkItem(context, {
    kind,
    slug: args[1] ?? "",
    title: requireOption(options.title, "--title"),
    ...(options.feature === undefined ? {} : { feature: options.feature }),
    ...(options.roadmap === undefined ? {} : { roadmap: options.roadmap }),
  });
  return { json: report, human: `Created ${report.kind} ${report.ref} at ${report.path}` };
}

export function formatProblem(problem: Problem): string {
  return `${problem.severity === "error" ? "error" : "warning"} ${problem.path}${problem.line === undefined ? "" : `:${problem.line}`} ${problem.message} [${problem.rule}]`;
}
