import { UsageError } from "./cli_context.ts";
import type { Command } from "./commands.ts";

/** Options every command takes. */
const GLOBAL_OPTIONS = ["json", "text", "help", "version"];

/**
 * Refuses an option the command doesn't take, rather than ignoring it, so a caller never gets
 * wider output than it asked for. An unknown subcommand is left to the handler to report.
 */
export function refuseUnknownOptions(name: string, args: string[], command: Command, given: string[]): void {
  const sub = Array.isArray(command.options) ? undefined : args[0];
  const taken = Array.isArray(command.options) ? command.options : sub === undefined ? undefined : (command.options as Record<string, readonly string[]>)[sub];
  if (taken === undefined) return;
  const refused = given.filter((option) => !GLOBAL_OPTIONS.includes(option) && !taken.includes(option));
  if (refused.length === 0) return;
  const which = sub === undefined ? `cruze ${name}` : `cruze ${name} ${sub}`;
  const takes = taken.length === 0 ? "it takes no options" : `it takes ${taken.map((o) => `--${o}`).join(", ")}`;
  throw new UsageError(`${which} doesn't take ${refused.map((o) => `--${o}`).join(", ")}; ${takes}`);
}
