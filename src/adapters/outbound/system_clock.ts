import type { Clock } from "../../app/ports/clock.ts";

/** The machine's clock, with dates in its local time zone. */
export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }

  today(): string {
    const date = new Date();
    const pad = (n: number): string => String(n).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }
}
