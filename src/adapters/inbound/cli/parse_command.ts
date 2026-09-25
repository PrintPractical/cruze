import { parseArgs } from "node:util";
import { UsageError, type Options } from "./cli_context.ts";

export interface ParsedCommand {
  /** The command and, for grouped commands, its subcommand, such as `new feature`. */
  words: string[];
  options: Options;
  help: boolean;
  version: boolean;
}

export function parseCommand(argv: string[]): ParsedCommand {
  let parsed;
  try {
    parsed = parseArgs({
      args: argv,
      allowPositionals: true,
      options: {
        name: { type: "string" },
        yes: { type: "boolean", short: "y", default: false },
        agent: { type: "string", multiple: true, default: [] },
        json: { type: "boolean", default: false },
        version: { type: "boolean", short: "v", default: false },
        help: { type: "boolean", short: "h", default: false },
        title: { type: "string" },
        feature: { type: "string" },
        roadmap: { type: "string" },
        change: { type: "string" },
        commit: { type: "string" },
        summary: { type: "string" },
        goals: { type: "string" },
        reason: { type: "string" },
        set: { type: "string", multiple: true, default: [] },
        item: { type: "string" },
        event: { type: "string" },
        out: { type: "string" },
        "no-redact": { type: "boolean", default: false },
        all: { type: "boolean", default: false },
        file: { type: "string", multiple: true, default: [] },
        ci: { type: "boolean", default: false },
        gate: { type: "string" },
        override: { type: "string" },
        overlap: { type: "boolean", default: false },
        round: { type: "string" },
        replan: { type: "string", multiple: true, default: [] },
        rebase: { type: "string", multiple: true, default: [] },
        base: { type: "string" },
        blockers: { type: "string" },
      },
    });
  } catch (error) {
    throw new UsageError(error instanceof Error ? error.message : String(error));
  }
  const { values, positionals } = parsed;
  const optional = <K extends string>(key: K, value: string | undefined): Partial<Record<K, string>> =>
    value === undefined ? {} : ({ [key]: value } as Record<K, string>);
  const options: Options = {
    yes: values.yes,
    agent: values.agent,
    json: values.json,
    set: values.set,
    redact: !values["no-redact"],
    all: values.all,
    file: values.file,
    ci: values.ci,
    overlap: values.overlap,
    replan: values.replan,
    rebase: values.rebase,
    ...optional("name", values.name),
    ...optional("title", values.title),
    ...optional("feature", values.feature),
    ...optional("roadmap", values.roadmap),
    ...optional("change", values.change),
    ...optional("commit", values.commit),
    ...optional("summary", values.summary),
    ...optional("goals", values.goals),
    ...optional("reason", values.reason),
    ...optional("item", values.item),
    ...optional("event", values.event),
    ...optional("out", values.out),
    ...optional("gate", values.gate),
    ...optional("override", values.override),
    ...optional("round", values.round),
    ...optional("base", values.base),
    ...optional("blockers", values.blockers),
  };
  return { words: positionals, options, help: values.help, version: values.version };
}
