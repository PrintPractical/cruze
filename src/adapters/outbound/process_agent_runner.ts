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
    if (program === undefined) return Promise.resolve({ exitCode: 127, output: "", error: "no command configured" });
    return new Promise((resolve) => {
      const child = spawn(program, args, { cwd: this.cwd, stdio: ["pipe", "pipe", "pipe"] });
      let output = "";
      let error = "";
      child.stdout.on("data", (chunk: Buffer) => (output += chunk.toString("utf8")));
      child.stderr.on("data", (chunk: Buffer) => (error += chunk.toString("utf8")));
      child.on("error", (failure) => resolve({ exitCode: 127, output, error: `${error}${failure.message}` }));
      child.on("close", (code) => resolve({ exitCode: code ?? 1, output, error }));
      child.stdin.end(prompt);
    });
  }
}
