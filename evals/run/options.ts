/** The command line of `node evals/run.ts`. */
import { existsSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { parseArgs } from "node:util";

export interface RunOptions {
  /** Absolute paths of the case files to run, in order. */
  cases: string[];
  /** The agent's command; it takes `-p <prompt>` like `claude`. */
  agent: string;
  /** The fixture project to copy for each case. */
  fixture: string;
  /** Where to write the report besides stdout. */
  out?: string;
  /** Keep every temporary copy, not only the failed ones. */
  keep: boolean;
}

export const USAGE = "usage: node evals/run.ts [case files or directories...] [--agent <command>] [--fixture <dir>] [--out <report.json>] [--keep]";

export function parseOptions(argv: string[], repoRoot: string): RunOptions {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      agent: { type: "string", default: "claude" },
      fixture: { type: "string", default: join(repoRoot, "examples/console-access") },
      out: { type: "string" },
      keep: { type: "boolean", default: false },
    },
  });
  const roots = positionals.length === 0 ? [join(repoRoot, "evals/cases")] : positionals.map((path) => resolve(path));
  return {
    cases: roots.flatMap(caseFiles),
    agent: values.agent,
    fixture: resolve(values.fixture),
    ...(values.out === undefined ? {} : { out: resolve(values.out) }),
    keep: values.keep,
  };
}

/** A directory's case files are its `.md` files other than `README.md`, by name. */
function caseFiles(path: string): string[] {
  if (!existsSync(path)) throw new Error(`no such case file or directory: ${path}`);
  if (!statSync(path).isDirectory()) return [path];
  return readdirSync(path)
    .filter((name) => name.endsWith(".md") && name !== "README.md")
    .sort()
    .map((name) => join(path, name));
}
