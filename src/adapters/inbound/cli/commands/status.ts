import { showStatus, suggestNext } from "../../../../app/use_cases/project_status.ts";
import type { NextStep } from "../../../../domain/next_step.ts";
import type { CliContext, CommandResult } from "../cli_context.ts";

export async function runStatus(context: CliContext): Promise<CommandResult> {
  const report = await showStatus(context);
  const lines = report.documents.map((d) => `${d.path}: ${d.state}`);
  for (const f of report.features) {
    const needs = f.needs.length === 0 ? "" : `, needs ${f.needs.join(", ")}`;
    const approval = f.approval === "missing" ? "" : `, ${f.approval}`;
    lines.push(`${f.slug}: ${f.status}${approval}${f.scenarios === 0 ? "" : `, ${f.scenarios} scenario(s)`}${needs}${f.inRelease ? "" : " (not in the release)"}`);
  }
  lines.push(`Next: ${describe(report.next)}`);
  return { json: report, human: lines.join("\n") };
}

export async function runNext(context: CliContext): Promise<CommandResult> {
  const next = await suggestNext(context);
  return { json: next, human: `Next: ${describe(next)}` };
}

function describe(step: NextStep): string {
  return `${step.step}${step.target === undefined ? "" : ` ${step.target}`}: ${step.reason}`;
}
