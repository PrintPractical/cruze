import type { Clock } from "../../src/app/ports/clock.ts";
import type { Repository } from "../../src/app/ports/repository.ts";

/** A repository with a settable branch and commit, files on other branches, and commits of the project's files. */
export class FakeRepository implements Repository {
  branch: string | null = "main";
  commit: string | null = "abc1234";
  user: string | null = "Test User <test@example.com>";
  readonly branches = new Map<string, Map<string, string>>();
  readonly history: Array<{ commit: string; files: Map<string, string> }> = [];

  /** Records the files as a new commit, as `git commit -a` would. */
  commitAll(files: Map<string, string>): string {
    const commit = `c${this.history.length + 1}`;
    this.history.push({ commit, files: new Map(files) });
    return commit;
  }

  async currentBranch(): Promise<string | null> {
    return this.branch;
  }

  async headCommit(): Promise<string | null> {
    return this.commit;
  }

  async userName(): Promise<string | null> {
    return this.user;
  }

  async otherBranches(): Promise<string[]> {
    return [...this.branches.keys()].filter((name) => name !== this.branch);
  }

  async filesOnBranch(branch: string, dir: string): Promise<Map<string, string>> {
    const files = this.branches.get(branch) ?? new Map<string, string>();
    return new Map([...files].filter(([path]) => path.startsWith(`${dir}/`)));
  }

  async firstCommitAdding(path: string, text: string): Promise<string | null> {
    return this.history.find((c) => c.files.get(path)?.includes(text) === true)?.commit ?? null;
  }

  async fileAt(commit: string, path: string): Promise<string | null> {
    return this.history.find((c) => c.commit === commit)?.files.get(path) ?? null;
  }
}

/** A clock that advances one second per reading, so journal order is stable. */
export class SteppingClock implements Clock {
  private current: number;

  constructor(start = "2026-09-26T09:00:00.000Z") {
    this.current = Date.parse(start);
  }

  now(): Date {
    const date = new Date(this.current);
    this.current += 1000;
    return date;
  }

  today(): string {
    return new Date(this.current).toISOString().slice(0, 10);
  }
}
