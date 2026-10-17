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

  async userName(): Promise<string | null> {
    const name = await this.git("config", "user.name");
    const email = await this.git("config", "user.email");
    if (name === null) return email;
    return email === null ? name : `${name} <${email}>`;
  }

  private async git(...args: string[]): Promise<string | null> {
    try {
      const { stdout } = await run("git", args, { cwd: this.root });
      return stdout.trimEnd();
    } catch {
      return null;
    }
  }
}
