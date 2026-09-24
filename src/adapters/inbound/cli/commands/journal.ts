import { exportFeedback, listEvents, recordEvent } from "../../../../app/use_cases/journal_events.ts";
import { UsageError, requireArgs, type CliContext, type CommandResult, type Options } from "../cli_context.ts";

export async function runJournal(context: CliContext, args: string[], options: Options): Promise<CommandResult> {
  requireArgs(args, ["add|list"]);
  if (args[0] === "add") {
    requireArgs(args, ["add", "event"]);
    const fields = Object.fromEntries(options.set.map((pair) => {
      const at = pair.indexOf("=");
      if (at < 1) throw new UsageError(`--set takes key=value, not "${pair}"`);
      return [pair.slice(0, at), pair.slice(at + 1)];
    }));
    const entry = await recordEvent(context, args[1] ?? "", fields, options.item);
    return { json: entry, human: `Recorded ${entry.event}.` };
  }
  if (args[0] === "list") {
    const entries = await listEvents(context, options.event);
    return { json: entries, human: entries.map((e) => `${e.at} ${e.event} ${JSON.stringify({ ...e, at: undefined, event: undefined, by: undefined })}`).join("\n") || "No entries." };
  }
  throw new UsageError(`cruze journal takes add or list, not "${args[0]}"`);
}

export async function runFeedback(context: CliContext, args: string[], options: Options): Promise<CommandResult> {
  if (args[0] !== "export") throw new UsageError("usage: cruze feedback export [--out <file>] [--no-redact]");
  const bundle = await exportFeedback(context, options.redact);
  if (options.out !== undefined) {
    await context.files.writeText(options.out, `${JSON.stringify(bundle, null, 2)}\n`);
    return { json: { out: options.out, entries: bundle.entries.length }, human: `Wrote ${bundle.entries.length} entries to ${options.out}.` };
  }
  return { json: bundle, human: `${bundle.entries.length} journal entries${bundle.redacted ? ", redacted" : ""}.` };
}
