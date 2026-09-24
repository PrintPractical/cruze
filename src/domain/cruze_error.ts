/** An expected failure the CLI reports to the user, as opposed to a bug. */
export class CruzeError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "CruzeError";
    this.code = code;
  }
}
