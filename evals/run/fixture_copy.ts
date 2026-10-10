/**
 * A fresh copy of the fixture project for one graded run: committed to git, with the
 * skills installed from source, a `cruze` shim first on the PATH, and the case's setup
 * applied and committed, so the agent's work is the whole diff.
 */
import { spawnSync } from "node:child_process";
import { chmodSync, cpSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

export interface FixtureCopy {
  /** The temporary directory holding the copy and the shim; removed as a whole. */
  root: string;
  /** The copied project, where the agent runs. */
  project: string;
  /** The environment the setup commands and the agent run with. */
  env: NodeJS.ProcessEnv;
}

const GIT_CONFIG = ["-c", "user.name=cruze-eval", "-c", "user.email=eval@cruze.invalid", "-c", "commit.gpgsign=false"];

export function prepareFixtureCopy(fixture: string, repoRoot: string, setup?: string): FixtureCopy {
  const root = mkdtempSync(join(tmpdir(), "cruze-eval-"));
  const project = join(root, "project");
  const main = join(repoRoot, "src/main.ts");
  cpSync(fixture, project, { recursive: true });
  const env = { ...process.env, PATH: `${shimDir(root, main)}:${process.env["PATH"] ?? ""}` };
  git(project, "init", "-q");
  commit(project, "fixture");
  run("cruze install", process.execPath, [main, "install", "--agent", "claude"], project, env);
  if (setup !== undefined) run("setup", "sh", ["-e", "-c", setup], project, env);
  commit(project, "prepared");
  return { root, project, env };
}

export function removeFixtureCopy(copy: FixtureCopy): void {
  rmSync(copy.root, { recursive: true, force: true });
}

/** Writes a `cruze` that runs the CLI from source, and returns its directory. */
function shimDir(root: string, main: string): string {
  const dir = join(root, "bin");
  mkdirSync(dir);
  const shim = join(dir, "cruze");
  writeFileSync(shim, `#!/bin/sh\nexec "${process.execPath}" "${main}" "$@"\n`);
  chmodSync(shim, 0o755);
  return dir;
}

function commit(project: string, message: string): void {
  git(project, "add", "-A");
  if (git(project, "status", "--porcelain").trim() === "") return;
  git(project, "commit", "-q", "-m", message);
}

function git(cwd: string, ...args: string[]): string {
  return run(`git ${args[0] ?? ""}`, "git", [...GIT_CONFIG, ...args], cwd, process.env);
}

function run(label: string, command: string, args: string[], cwd: string, env: NodeJS.ProcessEnv): string {
  const result = spawnSync(command, args, { cwd, env, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  if (result.error !== undefined) throw new Error(`${label}: ${result.error.message}`);
  if (result.status !== 0) throw new Error(`${label} exited ${result.status}: ${result.stderr.trim()}`);
  return result.stdout;
}
