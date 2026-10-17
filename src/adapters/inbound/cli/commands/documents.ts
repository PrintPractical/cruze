import { approveDocument } from "../../../../app/use_cases/approve_document.ts";
import { DOCUMENT_KINDS, createDocument, type DocumentKind } from "../../../../app/use_cases/new_document.ts";
import { validate } from "../../../../app/use_cases/validate_project.ts";
import type { Problem } from "../../../../domain/validation/problem.ts";
import { UsageError, requireArgs, type CliContext, type CommandResult, type Options } from "../cli_context.ts";

export async function runValidate(context: CliContext): Promise<CommandResult> {
  const report = await validate(context);
  const summary = report.problems.length === 0 ? "No problems." : `${report.errors} error(s), ${report.warnings} warning(s).`;
  return { json: report, human: [...report.problems.map(formatProblem), summary].join("\n"), failed: !report.valid };
}

export async function runApprove(context: CliContext, args: string[]): Promise<CommandResult> {
  requireArgs(args, ["document"]);
  const record = await approveDocument(context, args[0] ?? "");
  return { json: record, human: `Approved ${record.path} (${record.hash.slice(0, 19)}).` };
}

export async function runNew(context: CliContext, args: string[], options: Options): Promise<CommandResult> {
  requireArgs(args, ["kind"]);
  const kind = args[0] as DocumentKind;
  if (!DOCUMENT_KINDS.includes(kind)) throw new UsageError(`cruze new takes ${DOCUMENT_KINDS.join(", ")}, not "${args[0]}"`);
  if (kind === "feature") requireArgs(args, ["kind", "slug"]);
  const report = await createDocument(context, kind, args[1], options.title);
  return { json: report, human: `Created ${report.path}` };
}

export function formatProblem(problem: Problem): string {
  return `${problem.severity === "error" ? "error" : "warning"} ${problem.path}${problem.line === undefined ? "" : `:${problem.line}`} ${problem.message} [${problem.rule}]`;
}
