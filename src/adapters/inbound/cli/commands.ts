import type { Handler } from "./cli_context.ts";
import { runCheck, runLand, runTrace } from "./commands/code.ts";
import { runApprove, runNew, runValidate } from "./commands/documents.ts";
import { runInit } from "./commands/init.ts";
import { runInstall } from "./commands/install.ts";
import { runRealign } from "./commands/realign.ts";
import { runFeedback, runJournal } from "./commands/journal.ts";
import { runAbandon, runFeatures, runRoadmap, runTask } from "./commands/progress.ts";
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
  install: { handler: runInstall, options: ["agent"], usage: "install [--agent <agent>]                         install or update the Cruze skills" },
  validate: { handler: runValidate, options: [], usage: "validate                                          check every document against the formats" },
  status: { handler: runStatus, options: ["gate", "override", "overlap", "change"], usage: "status [--gate build [--override <reason>]] [--overlap [--change <ref>]]" },
  next: { handler: runNext, options: [], usage: "next                                              the step to run next on this branch, and why" },
  approve: {
    handler: runApprove,
    options: ["replan", "rebase", "by-agent", "restamp-unchanged"],
    usage: "approve <vision|architecture|roadmap|ref|path> [--replan <ID>...] [--rebase <ID>...] [--by-agent|--restamp-unchanged]   record an approval of a document",
  },
  new: {
    handler: runNew,
    options: { vision: [], glossary: [], architecture: [], roadmap: [], feature: ["title", "roadmap"], change: ["title", "feature", "roadmap"], adr: ["title"], note: ["title"] },
    usage: "new <vision|glossary|architecture|roadmap> | new <feature|change|adr|note> <slug> --title <title> [--feature <ref>] [--roadmap <slug>]",
  },
  task: { handler: runTask, options: { done: ["change", "commit"], deviation: ["change"], reopen: ["change"] }, usage: "task <done|deviation|reopen> <T#> [text] [--change <ref>] [--commit <sha>]" },
  features: { handler: runFeatures, options: { add: ["summary", "goals"], update: ["summary"], drop: ["reason"] }, usage: "features <add|update|drop> <slug> [--summary <text>] [--goals <ids>] [--reason <text>]" },
  roadmap: { handler: runRoadmap, options: { prune: [] }, usage: "roadmap prune                                     clear landed items from the roadmap status when a release closes" },
  journal: { handler: runJournal, options: { add: ["set", "item"], list: ["event", "item"] }, usage: "journal <add <event> --set key=value... [--item <ref>]|list [--event <event>] [--item <ref>]>" },
  review: { handler: runReviewCommand, options: ["item", "round", "blockers", "base"], usage: "review <role> [--item <ref>] [--round 1|2 --blockers <file>] [--base <commit>]   run a role in a fresh agent context" },
  feedback: { handler: runFeedback, options: { export: ["out", "no-redact"] }, usage: "feedback export [--out <file>] [--no-redact]" },
  trace: { handler: runTrace, options: ["all", "change"], usage: "trace [--all] [--change <ref>]                    link scenarios to the tests that prove them" },
  check: { handler: runCheck, options: ["file", "ci"], usage: "check [<file>...] [--ci]                          enforce layer rules and file budgets" },
  abandon: { handler: runAbandon, options: ["reason"], usage: "abandon <ref> --reason <text>                     archive a feature or standalone change that stops for good" },
  land: { handler: runLand, options: ["override"], usage: "land [<ref>] [--override <reason>]                merge a verified change into the living docs" },
  realign: { handler: runRealign, options: { status: ["full"], done: ["change"] }, usage: "realign <status [--full]|done [--change <ref>]>    what the installed Cruze expects of existing code, and recording that the code meets it" },
};

export const USAGE = `Usage: cruze <command> [options]

Commands:
${Object.values(COMMANDS).map((c) => `  ${c.usage}`).join("\n")}

Every command prints its result on stdout: JSON when stdout isn't a terminal or with --json,
and text on a terminal or with --text. Errors and notes go to stderr.`;
