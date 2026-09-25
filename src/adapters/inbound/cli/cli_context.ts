import type { ProjectDeps } from "../../../app/project_context.ts";
import type { AgentRunner } from "../../../app/ports/agent_runner.ts";
import type { Prompter } from "../../../app/ports/prompter.ts";

/** Everything a command handler needs, assembled by the composition root. */
export interface CliContext extends ProjectDeps {
  /** Asks a person; used only when the terminal is interactive and --yes is absent. */
  interactivePrompter: Prompter;
  /** Accepts every default. */
  unattendedPrompter: Prompter;
  interactive: boolean;
  /** Starts an agent in a fresh context for `cruze review`. */
  runner: AgentRunner;
  /** Name of the working directory, the default project name. */
  directoryName: string;
}

/** What a command produces: a JSON result for agents, a summary for people, and whether it passed. */
export interface CommandResult {
  json: unknown;
  human: string;
  /** Exit code 1 without an error: a check ran and found problems. */
  failed?: boolean;
}

/** Parsed options, shared by every command; each handler reads the ones it accepts. */
export interface Options {
  name?: string;
  yes: boolean;
  agent: string[];
  json: boolean;
  title?: string;
  feature?: string;
  roadmap?: string;
  change?: string;
  commit?: string;
  summary?: string;
  goals?: string;
  reason?: string;
  set: string[];
  item?: string;
  event?: string;
  out?: string;
  redact: boolean;
  all: boolean;
  file: string[];
  ci: boolean;
  gate?: string;
  override?: string;
  overlap: boolean;
  replan: string[];
  rebase: string[];
  round?: string;
  base?: string;
  blockers?: string;
}

export type Handler = (context: CliContext, args: string[], options: Options) => Promise<CommandResult>;

export class UsageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UsageError";
  }
}

export function requireArgs(args: string[], names: string[]): void {
  if (args.length < names.length) throw new UsageError(`missing ${names.slice(args.length).map((n) => `<${n}>`).join(" ")}`);
}

export function requireOption<T>(value: T | undefined, flag: string): T {
  if (value === undefined) throw new UsageError(`${flag} is required`);
  return value;
}
