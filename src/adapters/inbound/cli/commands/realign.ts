import { realignDone } from "../../../../app/use_cases/realign_done.ts";
import { realignStatus } from "../../../../app/use_cases/realign_status.ts";
import { UsageError, requireArgs, type CliContext, type CommandResult, type Options } from "../cli_context.ts";

export async function runRealign(context: CliContext, args: string[], options: Options): Promise<CommandResult> {
  requireArgs(args, ["status|done"]);
  if (args[0] === "status") {
    const report = await realignStatus(context, { full: options.full });
    const lines = [`Code meets Cruze ${report.standards}; the installed skills are ${report.target}${report.full ? " (full audit)" : ""}.`];
    for (const note of report.notes) {
      const open = note.findings.filter((f) => !f.waived);
      const how = note.detect !== undefined ? `${open.length} open finding(s) from ${note.detect}` : `for the auditor: ${note.ask ?? ""}`;
      lines.push(`${note.version} ${note.id}: ${note.title} (${how})`);
      for (const f of open) lines.push(`  ${f.path}${f.line === undefined ? "" : `:${f.line}`} ${f.message}`);
    }
    if (report.newWorkOnly.length > 0) lines.push(`New work only, nothing to move: ${report.newWorkOnly.join(", ")}`);
    if (report.notes.length === 0) lines.push("Nothing to realign.");
    return { json: report, human: lines.join("\n") };
  }
  if (args[0] === "done") {
    const report = await realignDone(context, options.change === undefined ? {} : { change: options.change });
    const lines = [report.from === report.to ? `The code already meets Cruze ${report.to}.` : `The code now meets Cruze ${report.to}, up from ${report.from}.`];
    if (report.scheduled !== undefined) lines.push(`${report.scheduled} fixes the rest.`);
    if (report.excepted.length > 0) lines.push(`Listed under check.exceptions until it lands: ${report.excepted.join(", ")}`);
    return { json: report, human: lines.join("\n") };
  }
  throw new UsageError(`cruze realign takes status or done, not "${args[0]}"`);
}
