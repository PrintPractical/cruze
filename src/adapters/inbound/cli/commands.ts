import type { Handler } from "./cli_context.ts";
import { runCheck, runTrace } from "./commands/code.ts";
import { runApprove, runNew, runValidate } from "./commands/documents.ts";
import { runInit } from "./commands/init.ts";
import { runInstall } from "./commands/install.ts";
import { runReviewCommand } from "./commands/review.ts";
import { runNext, runStatus } from "./commands/status.ts";

/** A command, and the options it takes: one list, or one per subcommand for a command that has them. */
export interface Command {
  handler: Handler;
  usage: string;
  options: readonly string[] | Readonly<Record<string, readonly string[]>>;
}

export const COMMANDS: Record<string, Command> = {
  init: { handler: runInit, options: ["name", "yes", "agent", "package"], usage: "init [--name <name>] [--yes] [--agent claude|other] [--package <npm spec>]   set up this repository and install the skills" },
  install: { handler: runInstall, options: ["agent"], usage: "install [--agent <agent>]                 install or update the Cruze skills" },
  new: { handler: runNew, options: { vision: [], architecture: [], feature: ["title"] }, usage: "new vision | new architecture | new feature <slug> [--title <title>]   start a document from its template" },
  validate: { handler: runValidate, options: [], usage: "validate                                  check every document against the formats" },
  approve: { handler: runApprove, options: [], usage: "approve <vision|architecture|feature slug>   record that the user approved a document as it reads now" },
  status: { handler: runStatus, options: [], usage: "status                                    each document's approval, each feature's progress, and the next step" },
  next: { handler: runNext, options: [], usage: "next                                      the step to run next, and why" },
  trace: { handler: runTrace, options: [], usage: "trace [<feature slug>]                    link scenarios to the tests that carry their IDs" },
  check: { handler: runCheck, options: ["ci"], usage: "check [<file>...] [--ci]                  enforce layer rules and file budgets" },
  review: { handler: runReviewCommand, options: ["feature", "base"], usage: "review <code-reviewer|researcher> [--feature <slug>] [--base <commit>]   run a role in a fresh agent context" },
};

export const USAGE = `Usage: cruze <command> [options]

Commands:
${Object.values(COMMANDS).map((c) => `  ${c.usage}`).join("\n")}

Every command prints its result on stdout: JSON when stdout isn't a terminal or with --json,
and text on a terminal or with --text. Errors and notes go to stderr.`;
