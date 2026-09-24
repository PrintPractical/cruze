import { execFile } from "node:child_process";
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
    const files = new Map<string, string>();
    const listing = await this.git("ls-tree", "-r", "--name-only", branch, "--", dir);
    for (const path of (listing ?? "").split("\n").filter((p) => p !== "")) {
      const text = await this.git("show", `${branch}:${path}`);
      if (text !== null) files.set(path, text);
    }
    return files;
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
