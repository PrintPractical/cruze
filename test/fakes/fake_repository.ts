import type { Clock } from "../../src/app/ports/clock.ts";
import type { Repository } from "../../src/app/ports/repository.ts";

/** A repository with a settable branch and commit, and files on other branches. */
export class FakeRepository implements Repository {
  branch: string | null = "main";
  commit: string | null = "abc1234";
  user: string | null = "Test User <test@example.com>";
  readonly branches = new Map<string, Map<string, string>>();

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
