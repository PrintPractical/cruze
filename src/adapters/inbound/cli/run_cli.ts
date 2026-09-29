import { versionNotice } from "../../../app/use_cases/record_version.ts";
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

/** Commands that set the version themselves, or report the skew as a problem of their own. */
const NO_VERSION_NOTICE = new Set(["init", "install", "validate"]);

/**
 * Runs one CLI invocation and returns the exit code: 0 on success, 1 when a check fails or
 * an expected error occurs, 2 for usage errors. Agents get JSON on stdout; people get a summary on stderr.
 * When the project's skills don't match this CLI, a note on stderr says so, even when the command fails.
 */
export async function runCli(argv: string[], context: CliContext, terminal: Terminal): Promise<number> {
  let json = !terminal.stdoutIsTerminal || argv.includes("--json");
  let notice: string | undefined;
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
    if (!NO_VERSION_NOTICE.has(name)) notice = await versionNotice(context.files, context.bundle.version);
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
  } finally {
    if (notice !== undefined) terminal.stderr(`cruze: note: ${notice}`);
  }
}
