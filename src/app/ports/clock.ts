/** The current time, so use cases stay deterministic under test. */
export interface Clock {
  now(): Date;
}
