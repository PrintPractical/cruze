import { showScope, type ScopeReport } from "../../../../app/use_cases/show_scope.ts";
import type { ShownElement } from "../../../../domain/project/scope_view.ts";
import { requireArgs, type CliContext, type CommandResult } from "../cli_context.ts";

export async function runShow(context: CliContext, args: string[]): Promise<CommandResult> {
  requireArgs(args, ["ref"]);
  const report = await showScope(context, args[0] ?? "");
  return { json: report, human: render(report) };
}

/** The scope as a document an agent reads in place of the living docs. */
function render(report: ScopeReport): string {
  const lines = [`# ${report.ref}${report.feature === undefined ? "" : ` (feature ${report.feature})`}`, ""];
  lines.push("## Elements", "", ...blocks(report.elements), "## Scenarios", "", ...blocks(report.scenarios));
  lines.push("## Cited, not shown", "");
  lines.push(...(report.cited.length === 0 ? ["None."] : report.cited.map((c) => `- ${c.id}: ${c.title} (${c.source})`)), "");
  lines.push("## Settled decisions", "", ...(report.decisions.length === 0 ? ["None."] : report.decisions), "");
  lines.push("## Dispositions", "");
  lines.push(...(report.dispositions.length === 0 ? ["None."] : report.dispositions.map((d) => `- [${d.disposition}, ${d.review}] ${d.finding}: ${d.reason}`)), "");
  if (report.missing.length > 0) lines.push("## Missing", "", ...report.missing.map((id) => `- ${id} is defined nowhere`), "");
  return lines.join("\n").trimEnd();
}

function blocks(elements: ShownElement[]): string[] {
  if (elements.length === 0) return ["None.", ""];
  return elements.flatMap((element) => [`<!-- ${element.source} -->`, ...element.body.join("\n").trimEnd().split("\n"), ""]);
}
