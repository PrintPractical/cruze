import { addFutureFeature, completeTask, dropFutureFeature, recordDeviation } from "../../../../app/use_cases/record_progress.ts";
import { UsageError, requireArgs, requireOption, type CliContext, type CommandResult, type Options } from "../cli_context.ts";

export async function runTask(context: CliContext, args: string[], options: Options): Promise<CommandResult> {
  requireArgs(args, ["done|deviation", "task"]);
  const change = options.change === undefined ? {} : { change: options.change };
  if (args[0] === "done") {
    const report = await completeTask(context, args[1] ?? "", { ...change, ...(options.commit === undefined ? {} : { commit: options.commit }) });
    return { json: report, human: `${report.task} done in ${report.change} (${report.done}/${report.total}).` };
  }
  if (args[0] === "deviation") {
    requireArgs(args, ["deviation", "task", "text"]);
    const report = await recordDeviation(context, args[1] ?? "", args.slice(2).join(" "), change);
    return { json: report, human: `Recorded a deviation on ${report.task} in ${report.change}.` };
  }
  throw new UsageError(`cruze task takes done or deviation, not "${args[0]}"`);
}

export async function runFeatures(context: CliContext, args: string[], options: Options): Promise<CommandResult> {
  requireArgs(args, ["add|drop", "slug"]);
  if (args[0] === "add") {
    const goals = (options.goals ?? "").split(",").map((g) => g.trim()).filter((g) => g !== "");
    const report = await addFutureFeature(context, args[1] ?? "", requireOption(options.summary, "--summary"), goals);
    return { json: report, human: `Added ${report.feature} to the future list.` };
  }
  if (args[0] === "drop") {
    const report = await dropFutureFeature(context, args[1] ?? "", requireOption(options.reason, "--reason"));
    return { json: report, human: `Dropped ${report.feature} from the future list.` };
  }
  throw new UsageError(`cruze features takes add or drop, not "${args[0]}"`);
}
