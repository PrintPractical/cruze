import { runReview } from "../../../../app/use_cases/run_review.ts";
import { UsageError, requireArgs, type CliContext, type CommandResult, type Options } from "../cli_context.ts";

export async function runReviewCommand(context: CliContext, args: string[], options: Options): Promise<CommandResult> {
  requireArgs(args, ["role"]);
  const round = options.round === undefined ? undefined : Number(options.round);
  if (round !== undefined && round !== 1 && round !== 2) throw new UsageError("--round is 1 or 2");
  const blockers = options.blockers === undefined ? undefined : await context.files.readText(options.blockers);
  if (options.blockers !== undefined && blockers === undefined) throw new UsageError(`cannot read ${options.blockers}`);
  const report = await runReview(context, {
    role: args[0] ?? "",
    ...(options.item === undefined ? {} : { item: options.item }),
    ...(round === undefined ? {} : { round }),
    ...(blockers === undefined ? {} : { blockers }),
    ...(options.base === undefined ? {} : { base: options.base }),
  });
  return { json: report, human: report.report };
}
