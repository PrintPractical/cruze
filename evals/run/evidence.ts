/** What the grader sees of the agent's work: the copy's git status and diff, and its journal. */
import { spawnSync } from "node:child_process";
import { join } from "node:path";

export interface Evidence {
  status: string;
  /** The working tree against the prepared commit, new files included. */
  diff: string;
  /** The journal entries as JSON, or why they could not be listed. */
  journal: string;
}

export function gatherEvidence(project: string, repoRoot: string): Evidence {
  const status = output("git", ["status", "--short"], project).stdout;
  // Intent-to-add gives new files a diff without staging anything else.
  output("git", ["add", "--all", "--intent-to-add"], project);
  const diff = output("git", ["diff", "HEAD"], project).stdout;
  return { status, diff, journal: journal(project, repoRoot) };
}

/** `cruze journal list --all --json`, or the current items' entries from a CLI without `--all`. */
function journal(project: string, repoRoot: string): string {
  const main = join(repoRoot, "src/main.ts");
  const all = output(process.execPath, [main, "journal", "list", "--all", "--json"], project);
  if (all.code === 0) return all.stdout;
  const current = output(process.execPath, [main, "journal", "list", "--json"], project);
  return current.code === 0 ? current.stdout : `(cruze journal list failed: ${current.stderr.trim()})`;
}

function output(command: string, args: string[], cwd: string): { code: number | null; stdout: string; stderr: string } {
  const result = spawnSync(command, args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], maxBuffer: 64 * 1024 * 1024 });
  return { code: result.status, stdout: result.stdout ?? "", stderr: result.stderr ?? "" };
}
