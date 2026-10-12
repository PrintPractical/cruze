import { upstreamDiff, type UpstreamDiffReport } from "../../../../app/use_cases/upstream_diff.ts";
import { requireArgs, type CliContext, type CommandResult } from "../cli_context.ts";

export async function runDiff(context: CliContext, args: string[]): Promise<CommandResult> {
  requireArgs(args, ["ref"]);
  const report = await upstreamDiff(context, args[0] ?? "");
  return { json: report, human: render(report) };
}

function render(report: UpstreamDiffReport): string {
  const lines = [`${report.artifact}: ${report.state}`];
  if (report.changes.length === 0) lines.push("Nothing it cites changed since its approval.");
  for (const change of report.changes) {
    lines.push("", `${change.key}${change.path === undefined ? "" : ` in ${change.path}`}:`);
    lines.push(...(change.diff ?? [change.note ?? ""]).map((line) => `  ${line}`));
  }
  if (report.rebase.length > 0) {
    lines.push("", `Its delta changes ${report.rebase.join(", ")}: rewrite the delta to keep the new text, then approve with ${report.rebase.map((id) => `--rebase ${id}`).join(" ")}.`);
  } else if (report.ref !== undefined && report.state === "upstream-changed") {
    lines.push("", `No rebase needed. When the work still holds against this, re-stamp it with cruze approve ${report.ref} --restamp-unchanged.`);
  }
  return lines.join("\n");
}
