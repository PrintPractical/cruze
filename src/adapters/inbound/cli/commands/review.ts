import { runReview } from "../../../../app/use_cases/run_review.ts";
import { requireArgs, type CliContext, type CommandResult, type Options } from "../cli_context.ts";

export async function runReviewCommand(context: CliContext, args: string[], options: Options): Promise<CommandResult> {
  requireArgs(args, ["role"]);
  const report = await runReview(context, {
    role: args[0] ?? "",
    ...(options.feature === undefined ? {} : { item: options.feature }),
    ...(options.base === undefined ? {} : { base: options.base }),
  });
  return { json: report, human: report.status === "reported" ? report.report : `${report.instruction}\n\n${report.prompt}` };
}
