/** Runs an agent's non-interactive mode, such as `claude -p`, to completion within a time limit. */
import { spawnSync } from "node:child_process";

export const AGENT_TIMEOUT_MS = 30 * 60 * 1000;
export const GRADER_TIMEOUT_MS = 10 * 60 * 1000;

export interface HeadlessRun {
  /** Undefined when the run never started, timed out or was killed; `failure` says why. */
  code: number | undefined;
  stdout: string;
  stderr: string;
  failure?: string;
}

const OUTPUT_LIMIT = 64 * 1024 * 1024;

export function runHeadless(command: string, args: string[], cwd: string, env: NodeJS.ProcessEnv, timeoutMs: number): HeadlessRun {
  const result = spawnSync(command, args, {
    cwd,
    env,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    timeout: timeoutMs,
    maxBuffer: OUTPUT_LIMIT,
  });
  const stdout = result.stdout ?? "";
  const stderr = result.stderr ?? "";
  if (result.error !== undefined) return { code: undefined, stdout, stderr, failure: describe(result.error, command, timeoutMs) };
  if (result.status === null) return { code: undefined, stdout, stderr, failure: `killed by ${result.signal ?? "a signal"}` };
  return { code: result.status, stdout, stderr };
}

/** The last lines of a run's stderr, for an error reason. */
export function stderrTail(text: string, lines = 20): string {
  return text.trimEnd().split("\n").slice(-lines).join("\n");
}

function describe(error: NodeJS.ErrnoException, command: string, timeoutMs: number): string {
  if (error.code === "ETIMEDOUT") return `timed out after ${Math.round(timeoutMs / 60_000)} minutes`;
  if (error.code === "ENOENT") return `${command} is not installed`;
  return error.message;
}
