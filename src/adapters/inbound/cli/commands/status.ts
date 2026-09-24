import { checkBuildGate, findOverlaps, showStatus } from "../../../../app/use_cases/project_status.ts";
import type { ApprovalStatus } from "../../../../domain/approvals/evaluate.ts";
import { UsageError, type CliContext, type CommandResult, type Options } from "../cli_context.ts";

export async function runStatus(context: CliContext, _args: string[], options: Options): Promise<CommandResult> {
  if (options.gate !== undefined) {
    if (options.gate !== "build") throw new UsageError(`unknown gate "${options.gate}"; the only gate is build`);
    const report = await checkBuildGate(context, options.override);
    const human = report.passed
      ? report.overridden ? `Build gate overridden and journaled:\n  ${report.reasons.join("\n  ")}` : "Build gate passed."
      : `Build gate blocked:\n  ${report.reasons.join("\n  ")}`;
    return { json: report, human, failed: !report.passed };
  }
  if (options.overlap) {
    const report = await findOverlaps(context, options.change);
    const human = report.overlaps.length === 0
      ? `No other branch touches what ${report.change} touches.`
      : report.overlaps.map((o) => `${o.branch}: ${o.item} also touches ${o.shared.join(", ")}`).join("\n");
    return { json: report, human };
  }
  const report = await showStatus(context);
  const lines = [`Branch: ${report.branch ?? "(none)"}${report.active === undefined ? "" : `, building ${report.active}`}`];
  for (const doc of report.documents) lines.push(describe(doc.artifact, doc));
  for (const feature of report.features) {
    lines.push(describe(`feature ${feature.ref}`, feature.approval));
    for (const change of feature.changes) {
      const name = change.ref.split("/")[1] ?? change.ref;
      lines.push(change.landed !== undefined ? `  ${name}: landed ${change.landed}` : `  ${describe(name, change.approval)}, tasks ${change.tasksDone}/${change.tasksTotal}`);
    }
  }
  for (const change of report.standalone) lines.push(`${describe(`change ${change.ref}`, change.approval)}, tasks ${change.tasksDone}/${change.tasksTotal}`);
  return { json: report, human: lines.join("\n") };
}

function describe(label: string, status: ApprovalStatus): string {
  const detail = status.changed.length > 0 ? ` (${status.changed.join(", ")})` : status.unjournaled === true ? " (no journal entry)" : "";
  return `${label}: ${status.state}${detail}`;
}
