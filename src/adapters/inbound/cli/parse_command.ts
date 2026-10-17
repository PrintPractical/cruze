import { parseArgs } from "node:util";
import { UsageError, type Options } from "./cli_context.ts";

export interface ParsedCommand {
  /** The command and, for grouped commands, its subcommand, such as `new feature`. */
  words: string[];
  options: Options;
  /** The options given on the command line, by long name, so a command can refuse ones it doesn't take. */
  given: string[];
  help: boolean;
  version: boolean;
}

export function parseCommand(argv: string[]): ParsedCommand {
  let parsed;
  try {
    parsed = parseArgs({
      args: argv,
      allowPositionals: true,
      tokens: true,
      options: {
        name: { type: "string" },
        yes: { type: "boolean", short: "y", default: false },
        agent: { type: "string", multiple: true, default: [] },
        json: { type: "boolean", default: false },
        text: { type: "boolean", default: false },
        version: { type: "boolean", short: "v", default: false },
        help: { type: "boolean", short: "h", default: false },
        title: { type: "string" },
        feature: { type: "string" },
        ci: { type: "boolean", default: false },
        package: { type: "string" },
        base: { type: "string" },
      },
    });
  } catch (error) {
    throw new UsageError(error instanceof Error ? error.message : String(error));
  }
  const { values, positionals, tokens } = parsed;
  const optional = <K extends string>(key: K, value: string | undefined): Partial<Record<K, string>> =>
    value === undefined ? {} : ({ [key]: value } as Record<K, string>);
  const options: Options = {
    yes: values.yes,
    agent: values.agent,
    json: values.json,
    text: values.text,
    ci: values.ci,
    ...optional("name", values.name),
    ...optional("title", values.title),
    ...optional("feature", values.feature),
    ...optional("package", values.package),
    ...optional("base", values.base),
  };
  const given = [...new Set(tokens.flatMap((token) => (token.kind === "option" ? [token.name] : [])))];
  return { words: positionals, options, given, help: values.help, version: values.version };
}
