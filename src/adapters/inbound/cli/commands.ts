import type { Handler } from "./cli_context.ts";
import { runCheck, runLand, runTrace } from "./commands/code.ts";
import { runApprove, runNew, runValidate } from "./commands/documents.ts";
import { runInit } from "./commands/init.ts";
import { runInstall } from "./commands/install.ts";
import { runFeedback, runJournal } from "./commands/journal.ts";
import { runFeatures, runRoadmap, runTask } from "./commands/progress.ts";
import { runStatus } from "./commands/status.ts";

export const COMMANDS: Record<string, { handler: Handler; usage: string }> = {
  init: { handler: runInit, usage: "init [--name <name>] [--yes] [--agent <agent>]   set up this repository and install the skills" },
  install: { handler: runInstall, usage: "install [--agent <agent>]                         install or update the Cruze skills" },
  validate: { handler: runValidate, usage: "validate                                          check every document against the formats" },
  status: { handler: runStatus, usage: "status [--gate build [--override <reason>]] [--overlap [--change <ref>]]" },
  approve: { handler: runApprove, usage: "approve <vision|architecture|roadmap|ref|path>    record your approval of a document" },
  new: { handler: runNew, usage: "new <vision|glossary|architecture|roadmap> | new <feature|change|adr|note> <slug> --title <title> [--feature <ref>] [--roadmap <slug>]" },
  task: { handler: runTask, usage: "task <done|deviation> <T#> [text] [--change <ref>] [--commit <sha>]" },
  features: { handler: runFeatures, usage: "features <add|drop> <slug> [--summary <text> --goals <ids>] [--reason <text>]" },
  roadmap: { handler: runRoadmap, usage: "roadmap prune                                     clear landed items from the roadmap status when a release closes" },
  journal: { handler: runJournal, usage: "journal <add <event> --set key=value... [--item <ref>]|list [--event <event>]>" },
  feedback: { handler: runFeedback, usage: "feedback export [--out <file>] [--no-redact]" },
  trace: { handler: runTrace, usage: "trace [--all] [--change <ref>]                    link scenarios to the tests that prove them" },
  check: { handler: runCheck, usage: "check [<file>...] [--ci]                          enforce layer rules and file budgets" },
  land: { handler: runLand, usage: "land [<ref>]                                      merge a finished change into the living docs" },
};

export const USAGE = `Usage: cruze <command> [options]

Commands:
${Object.values(COMMANDS).map((c) => `  ${c.usage}`).join("\n")}

Every command prints JSON on stdout when it isn't a terminal, or with --json.`;
