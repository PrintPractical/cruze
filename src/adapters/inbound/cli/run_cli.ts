import { CruzeError } from "../../../domain/cruze_error.ts";
import { type CliContext, type CommandResult, UsageError } from "./cli_context.ts";
import { runInit } from "./commands/init.ts";
import { runInstall } from "./commands/install.ts";
import { USAGE, parseCommand } from "./parse_command.ts";

export interface Terminal {
  stdout(text: string): void;
  stderr(text: string): void;
  /** True when stdout is a terminal, so a person rather than an agent is reading it. */
  stdoutIsTerminal: boolean;
}

/**
 * Runs one CLI invocation and returns the exit code. Agents get JSON on stdout;
 * people get a summary on stderr, and JSON only when they ask for it.
 */
export async function runCli(argv: string[], context: CliContext, terminal: Terminal): Promise<number> {
  let json = !terminal.stdoutIsTerminal;
  try {
    const parsed = parseCommand(argv);
    let result: CommandResult;
    switch (parsed.command) {
      case "help":
        terminal.stderr(USAGE);
        return 0;
      case "version":
        terminal.stdout(context.bundle.version);
        return 0;
      case "init":
        json ||= parsed.json;
        result = await runInit(context, parsed.options);
        break;
      case "install":
        json ||= parsed.json;
        result = await runInstall(context, parsed.options);
        break;
    }
    terminal.stderr(result.human);
    if (json) terminal.stdout(JSON.stringify(result.json, null, 2));
    return 0;
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
