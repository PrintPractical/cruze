import { installSkills, type InstallSkillsReport } from "../../../../app/use_cases/install_skills.ts";
import type { CliContext, CommandResult, Options } from "../cli_context.ts";

export async function runInstall(context: CliContext, _args: string[], options: Options): Promise<CommandResult> {
  const report = await installSkills({ files: context.files, bundle: context.bundle }, { agents: options.agent });
  return { json: report, human: describeSkillInstall(report).join("\n") };
}

export function describeSkillInstall(report: InstallSkillsReport): string[] {
  const count = report.installed.length;
  const lines = [`Installed ${count} Cruze skill${count === 1 ? "" : "s"} into .agents/skills/: ${report.installed.join(", ")}`];
  if (report.removed.length > 0) lines.push(`Removed skills no longer shipped: ${report.removed.join(", ")}`);
  for (const link of report.linked) lines.push(`Linked them for ${link.agent} in ${link.dir}/`);
  return lines;
}
