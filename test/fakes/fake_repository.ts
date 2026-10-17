import type { Clock } from "../../src/app/ports/clock.ts";
import type { Repository } from "../../src/app/ports/repository.ts";

/** A repository with a settable user. */
export class FakeRepository implements Repository {
  user: string | null = "Test User <test@example.com>";

  async userName(): Promise<string | null> {
    return this.user;
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
