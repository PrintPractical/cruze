import type { Bundle } from "../../../app/ports/bundle.ts";
import type { ProjectFiles } from "../../../app/ports/project_files.ts";
import type { Prompter } from "../../../app/ports/prompter.ts";

/** Everything a command handler needs, assembled by the composition root. */
export interface CliContext {
  files: ProjectFiles;
  bundle: Bundle;
  /** Asks a person; used only when the terminal is interactive and --yes is absent. */
  interactivePrompter: Prompter;
  /** Accepts every default. */
  unattendedPrompter: Prompter;
  interactive: boolean;
  /** Name of the working directory, the default project name. */
  directoryName: string;
}

/** What a command produces: a JSON result for agents and a summary for people. */
export interface CommandResult {
  json: unknown;
  human: string;
}

export class UsageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UsageError";
  }
}
