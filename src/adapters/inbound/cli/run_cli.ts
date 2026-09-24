import { CruzeError } from "../../../domain/cruze_error.ts";
import { type CliContext, UsageError } from "./cli_context.ts";
import { COMMANDS, USAGE } from "./commands.ts";
import { parseCommand } from "./parse_command.ts";

export interface Terminal {
  stdout(text: string): void;
  stderr(text: string): void;
  /** True when stdout is a terminal, so a person rather than an agent is reading it. */
  stdoutIsTerminal: boolean;
}

/**
 * Runs one CLI invocation and returns the exit code: 0 on success, 1 when a check fails or
 * an expected error occurs, 2 for usage errors. Agents get JSON on stdout; people get a summary on stderr.
 */
export async function runCli(argv: string[], context: CliContext, terminal: Terminal): Promise<number> {
  let json = !terminal.stdoutIsTerminal || argv.includes("--json");
  try {
    const parsed = parseCommand(argv);
    json ||= parsed.options.json;
    if (parsed.version) {
      terminal.stdout(context.bundle.version);
      return 0;
    }
    const [name, ...args] = parsed.words;
    if (parsed.help || name === undefined || name === "help") {
      terminal.stderr(USAGE);
      return 0;
    }
    const command = COMMANDS[name];
    if (command === undefined) throw new UsageError(`Unknown command: ${name}`);
    const result = await command.handler(context, args, parsed.options);
    terminal.stderr(result.human);
    if (json) terminal.stdout(JSON.stringify(result.json, null, 2));
    return result.failed === true ? 1 : 0;
  } catch (error) {
    if (error instanceof UsageError) {
      terminal.stderr(`${error.message}\n\n${USAGE}`);
      if (json) terminal.stdout(JSON.stringify({ error: { code: "usage", message: error.message } }));
      return 2;
    }
    if (error instanceof CruzeError) {
      terminal.stderr(`cruze: ${error.message}`);
      if (json) terminal.stdout(JSON.stringify({ error: { code: error.code, message: error.message } }));
      return 1;
    }
    throw error;
  }
}
