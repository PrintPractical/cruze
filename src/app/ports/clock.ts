/** The current time, so use cases stay deterministic under test. */
export interface Clock {
  now(): Date;
  /** Today's date in the user's time zone, as `YYYY-MM-DD`, for dated IDs and records. */
  today(): string;
}
