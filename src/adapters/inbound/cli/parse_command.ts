import { parseArgs } from "node:util";
import type { InitOptions } from "./commands/init.ts";
import type { InstallOptions } from "./commands/install.ts";
import { UsageError } from "./cli_context.ts";

export type ParsedCommand =
  | { command: "help" }
  | { command: "version" }
  | { command: "init"; json: boolean; options: InitOptions }
  | { command: "install"; json: boolean; options: InstallOptions };

export const USAGE = `Usage: cruze <command> [options]

Commands:
  init       Set up this repository for Cruze and install the skills
  install    Install or update the Cruze skills in this repository
  help       Show this help

Options:
  --name <name>    Project name for init (asked for when omitted)
  --yes, -y        Accept defaults without asking
  --agent <name>   Also link skills for this agent (repeatable; known: claude)
  --json           Print the JSON result even on a terminal
  --version, -v    Print the Cruze version
  --help, -h       Show this help`;

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
      },
    });
  } catch (error) {
    throw new UsageError(error instanceof Error ? error.message : String(error));
  }

  const { values, positionals } = parsed;
  if (values.version) return { command: "version" };
  const [command, ...extra] = positionals;
  if (values.help || command === undefined || command === "help") return { command: "help" };
  if (extra.length > 0) throw new UsageError(`Unexpected argument: ${extra.join(" ")}`);

  switch (command) {
    case "init":
      return {
        command,
        json: values.json,
        options: { yes: values.yes, agents: values.agent, ...(values.name === undefined ? {} : { name: values.name }) },
      };
    case "install":
      if (values.name !== undefined) throw new UsageError("--name only applies to init");
      return { command, json: values.json, options: { agents: values.agent } };
    default:
      throw new UsageError(`Unknown command: ${command}`);
  }
}
