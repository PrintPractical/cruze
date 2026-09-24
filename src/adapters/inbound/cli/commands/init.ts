import { initProject } from "../../../../app/use_cases/init_project.ts";
import type { CliContext, CommandResult, Options } from "../cli_context.ts";
import { describeSkillInstall } from "./install.ts";

export async function runInit(context: CliContext, _args: string[], options: Options): Promise<CommandResult> {
  const prompter = options.yes || !context.interactive ? context.unattendedPrompter : context.interactivePrompter;
  const report = await initProject(
    { files: context.files, bundle: context.bundle, prompter },
    { defaultName: context.directoryName, agents: options.agent, ...(options.name === undefined ? {} : { name: options.name }) },
  );

  const lines = [`Initialized ${report.project} with Cruze ${report.skills.version}.`];
  if (report.created.length > 0) lines.push(`Created: ${report.created.join(", ")}`);
  if (report.skipped.length > 0) lines.push(`Left untouched (already present): ${report.skipped.join(", ")}`);
  lines.push(...describeSkillInstall(report.skills));
  lines.push("Next: open your coding agent in this repository and ask it what Cruze can do.");
  return { json: report, human: lines.join("\n") };
}
