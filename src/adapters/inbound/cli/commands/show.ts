import { showElements, showIndex } from "../../../../app/use_cases/show_elements.ts";
import { showScope, type ScopeReport } from "../../../../app/use_cases/show_scope.ts";
import { isId } from "../../../../domain/ids.ts";
import type { ElementIndex } from "../../../../domain/project/element_lookup.ts";
import type { ShownElement } from "../../../../domain/project/scope_view.ts";
import { UsageError, requireArgs, type CliContext, type CommandResult, type Options } from "../cli_context.ts";

export async function runShow(context: CliContext, args: string[], options: Options): Promise<CommandResult> {
  if (options.index) {
    if (args.length > 1) throw new UsageError("--index takes at most one context or capability");
    const index = await showIndex(context, args[0]);
    return { json: index, human: renderIndex(index) };
  }
  requireArgs(args, ["ref"]);
  if (args.every(isId)) {
    const report = await showElements(context, args);
    return { json: report, human: blocks(report.elements).join("\n").trimEnd() };
  }
  if (args.length > 1) throw new UsageError("show takes one feature or change, or one or more element IDs");
  const report = await showScope(context, args[0] ?? "");
  return { json: report, human: render(report) };
}

/** The index as a list an agent scans for what exists, before fetching bodies with `cruze show <ID>`. */
function renderIndex(index: ElementIndex): string {
  const { architecture, specs } = index.words;
  const lines = [`# Elements`, "", `docs/architecture.md holds ${architecture} words, and docs/specs/ ${specs}. Read an element's body with \`cruze show <ID>\`.`];
  let source = "";
  for (const entry of [...index.entries].sort((a, b) => Number(a.addedBy !== undefined) - Number(b.addedBy !== undefined))) {
    const heading = entry.addedBy === undefined ? entry.source : "In flight, not yet merged";
    if (heading !== source) lines.push("", `## ${heading}`, "");
    source = heading;
    const facts = [
      entry.status,
      entry.place,
      entry.scenarios === undefined ? undefined : `${entry.scenarios} scenarios`,
      entry.addedBy === undefined ? undefined : `added by ${entry.addedBy}`,
      entry.changedBy.length === 0 ? undefined : `changed by ${entry.changedBy.join(", ")}`,
    ].filter((f) => f !== undefined);
    lines.push(`- ${entry.id}: ${entry.title}${facts.length === 0 ? "" : ` (${facts.join("; ")})`}`);
  }
  return lines.join("\n");
}

/** The scope as a document an agent reads in place of the living docs. */
function render(report: ScopeReport): string {
  const lines = [`# ${report.ref}${report.feature === undefined ? "" : ` (feature ${report.feature})`}`, ""];
  lines.push("## Elements", "", ...blocks(report.elements), "## Scenarios", "", ...blocks(report.scenarios));
  lines.push("## Cited, not shown", "");
  lines.push(...(report.cited.length === 0 ? ["None."] : report.cited.map((c) => `- ${c.id}: ${c.title} (${c.source})`)), "");
  if (report.feature === undefined) lines.push("## Settled decisions", "", ...(report.decisions.length === 0 ? ["None."] : report.decisions), "");
  else {
    lines.push("## Settled decisions of the feature", "", ...(report.decisions.length === 0 ? ["None."] : report.decisions), "");
    lines.push("## Settled decisions of the change", "", ...(report.changeDecisions.length === 0 ? ["None."] : report.changeDecisions), "");
  }
  lines.push("## Dispositions", "");
  lines.push(...(report.dispositions.length === 0 ? ["None."] : report.dispositions.map((d) => `- [${d.disposition}, ${d.review}] ${d.finding}: ${d.reason}`)), "");
  if (report.references.length > 0) lines.push("## References", "", ...report.references.map((r) => `- \`${r.path}\`: ${r.use}`), "");
  if (report.missing.length > 0) lines.push("## Missing", "", ...report.missing.map((id) => `- ${id} is defined nowhere`), "");
  return lines.join("\n").trimEnd();
}

function blocks(elements: ShownElement[]): string[] {
  if (elements.length === 0) return ["None.", ""];
  return elements.flatMap((element) => [`<!-- ${element.source} -->`, ...element.body.join("\n").trimEnd().split("\n"), ""]);
}
