/** Starts a coding agent in a fresh context, non-interactively, and collects what it reports. */
export interface AgentRunner {
  /** Runs `command` in the project root with `prompt` on standard input. */
  run(command: string[], prompt: string): Promise<AgentRun>;
}

export interface AgentRun {
  exitCode: number;
  output: string;
  error: string;
}
