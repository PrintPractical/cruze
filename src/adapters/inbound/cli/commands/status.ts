import { checkBuildGate, findOverlaps, showStatus, suggestNext } from "../../../../app/use_cases/project_status.ts";
import type { ApprovalStatus } from "../../../../domain/approvals/evaluate.ts";
import { UsageError, type CliContext, type CommandResult, type Options } from "../cli_context.ts";

export async function runStatus(context: CliContext, _args: string[], options: Options): Promise<CommandResult> {
  if (options.override !== undefined && options.gate === undefined) throw new UsageError("--override goes with --gate build");
  if (options.change !== undefined && !options.overlap) throw new UsageError("--change goes with --overlap");
  if (options.gate !== undefined && options.overlap) throw new UsageError("--gate and --overlap are alternatives");
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
  const json = {
    ...report,
    documents: report.documents.map(compact),
    features: report.features.map((f) => ({ ...f, approval: compact(f.approval), changes: f.changes.map((c) => ({ ...c, approval: compact(c.approval) })) })),
    standalone: report.standalone.map((c) => ({ ...c, approval: compact(c.approval) })),
  };
  return { json, human: lines.join("\n") };
}

/** The state without the record's hashes: an agent reads status often, and the hashes were a third of each read. */
function compact(status: ApprovalStatus): Omit<ApprovalStatus, "record"> & { approvedAt?: string; by?: string; basis?: string } {
  const { record, ...rest } = status;
  if (record === undefined) return rest;
  return { ...rest, approvedAt: record.approvedAt, by: record.by, ...(record.basis === undefined ? {} : { basis: record.basis }) };
}

/** Every step starts a new session: one session that ran plan, build, verify and land reached 745k tokens of context. */
const FRESH_SESSION = "Run it in a new session, so its context starts empty.";

const BASIS: Record<string, string> = { "plan-review": " (by the agent, after its plan review)", rethink: " (re-stamped by the agent after a rethink)" };

function describe(label: string, status: ApprovalStatus): string {
  const byAgent = status.state === "approved" ? BASIS[status.record?.basis ?? ""] ?? "" : "";
  const detail = status.changed.length > 0 ? ` (${status.changed.join(", ")})` : status.unjournaled === true ? " (no journal entry)" : byAgent;
  return `${label}: ${status.state}${detail}`;
}

export async function runNext(context: CliContext): Promise<CommandResult> {
  const report = await suggestNext(context);
  const describe = (s: { step: string; target?: string; reason: string }): string => `${s.step}${s.target === undefined ? "" : ` ${s.target}`}: ${s.reason}`;
  const lines = [`Next: ${describe(report.next)}`, ...report.also.map((s) => `Also: ${describe(s)}`), FRESH_SESSION];
  return { json: { ...report, session: FRESH_SESSION }, human: lines.join("\n") };
}
