import { spawn } from "node:child_process";
import type { AgentRun, AgentRunner } from "../../app/ports/agent_runner.ts";

/** Runs an agent's non-interactive mode, such as `claude -p`, as a child process. */
export class ProcessAgentRunner implements AgentRunner {
  private readonly cwd: string;

  constructor(cwd: string) {
    this.cwd = cwd;
  }

  run(command: string[], prompt: string): Promise<AgentRun> {
    const [program, ...args] = command;
    if (program === undefined) return Promise.resolve({ kind: "missing" });
    return new Promise((resolve) => {
      const child = spawn(program, args, { cwd: this.cwd, stdio: ["pipe", "pipe", "pipe"] });
      let output = "";
      let error = "";
      child.stdout.on("data", (chunk: Buffer) => (output += chunk.toString("utf8")));
      child.stderr.on("data", (chunk: Buffer) => (error += chunk.toString("utf8")));
      // Spawning reports ENOENT when the program isn't on the PATH.
      child.on("error", (failure: NodeJS.ErrnoException) =>
        resolve(failure.code === "ENOENT" ? { kind: "missing" } : { kind: "finished", exitCode: 127, output, error: `${error}${failure.message}` }),
      );
      child.on("close", (code) => resolve({ kind: "finished", exitCode: code ?? 1, output, error }));
      // A program that never started closes stdin; ignore the write error, since the spawn error reports it.
      child.stdin.on("error", () => {});
      child.stdin.end(prompt);
    });
  }
}
