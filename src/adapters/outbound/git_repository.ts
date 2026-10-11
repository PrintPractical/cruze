import { execFile, spawn } from "node:child_process";
import { promisify } from "node:util";
import type { Repository } from "../../app/ports/repository.ts";

const run = promisify(execFile);

/** The git repository at a directory, driven through the git command. */
export class GitRepository implements Repository {
  private readonly root: string;

  constructor(root: string) {
    this.root = root;
  }

  async currentBranch(): Promise<string | null> {
    const branch = await this.git("rev-parse", "--abbrev-ref", "HEAD");
    return branch === null || branch === "HEAD" ? null : branch;
  }

  async headCommit(): Promise<string | null> {
    return this.git("rev-parse", "--short", "HEAD");
  }

  async userName(): Promise<string | null> {
    const name = await this.git("config", "user.name");
    const email = await this.git("config", "user.email");
    if (name === null) return email;
    return email === null ? name : `${name} <${email}>`;
  }

  async otherBranches(): Promise<string[]> {
    const current = await this.currentBranch();
    const listing = await this.git("for-each-ref", "--format=%(refname:short)", "refs/heads", "refs/remotes");
    return (listing ?? "")
      .split("\n")
      .filter((ref) => ref !== "" && ref !== current && !ref.endsWith("/HEAD") && ref !== `origin/${current}`);
  }

  async filesOnBranch(branch: string, dir: string): Promise<Map<string, string>> {
    const listing = await this.git("ls-tree", "-r", "--name-only", branch, "--", dir);
    const paths = (listing ?? "").split("\n").filter((p) => p !== "");
    if (paths.length === 0) return new Map();
    // One git process for every file: a process per file took up to two minutes on a project with 26 branches.
    const blobs = await this.catFiles(paths.map((path) => `${branch}:${path}`));
    return new Map(paths.flatMap((path, i) => (blobs[i] === undefined ? [] : [[path, blobs[i]] as [string, string]])));
  }

  /** The contents of each object, in order, through one `git cat-file --batch`; undefined for one that is missing. */
  private catFiles(objects: string[]): Promise<Array<string | undefined>> {
    return new Promise((resolve) => {
      const child = spawn("git", ["cat-file", "--batch"], { cwd: this.root, stdio: ["pipe", "pipe", "ignore"] });
      const chunks: Buffer[] = [];
      child.stdout.on("data", (chunk: Buffer) => chunks.push(chunk));
      child.on("error", () => resolve(objects.map(() => undefined)));
      child.on("close", () => resolve(parseBatch(Buffer.concat(chunks), objects.length)));
      child.stdin.end(`${objects.join("\n")}\n`);
    });
  }

  private async git(...args: string[]): Promise<string | null> {
    try {
      const { stdout } = await run("git", args, { cwd: this.root, maxBuffer: 64 * 1024 * 1024 });
      return stdout.trimEnd();
    } catch {
      return null;
    }
  }
}

/** Splits `git cat-file --batch` output: a `<sha> <type> <size>` header, the bytes and a newline, or `<name> missing`. */
function parseBatch(output: Buffer, count: number): Array<string | undefined> {
  const results: Array<string | undefined> = [];
  let at = 0;
  while (results.length < count && at < output.length) {
    const headerEnd = output.indexOf(10, at);
    if (headerEnd === -1) break;
    const header = output.subarray(at, headerEnd).toString("utf8");
    const size = /^[0-9a-f]+ \w+ (\d+)$/.exec(header)?.[1];
    if (size === undefined) {
      results.push(undefined);
      at = headerEnd + 1;
      continue;
    }
    const start = headerEnd + 1;
    results.push(output.subarray(start, start + Number(size)).toString("utf8"));
    at = start + Number(size) + 1;
  }
  while (results.length < count) results.push(undefined);
  return results;
}
