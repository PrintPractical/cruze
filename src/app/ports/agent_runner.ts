/** Starts a coding agent in a fresh context, non-interactively, and collects what it reports. */
export interface AgentRunner {
  /**
   * Runs `command` in the project root with `prompt` on standard input. Reports `missing`,
   * without running anything, when the command's program isn't installed.
   */
  run(command: string[], prompt: string): Promise<AgentRun>;
}

export type AgentRun = { kind: "finished"; exitCode: number; output: string; error: string } | { kind: "missing" };
