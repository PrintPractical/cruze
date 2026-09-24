import { CruzeError } from "./cruze_error.ts";

export type ProjectName = string & { readonly __brand: "ProjectName" };

const MAX_LENGTH = 100;

/** A project name is a single line of human-readable text, used as the README title. */
export function parseProjectName(raw: string): ProjectName {
  const name = raw.trim();
  if (name.length === 0) {
    throw new CruzeError("invalid-project-name", "The project name is empty.");
  }
  if (/[\r\n]/.test(name)) {
    throw new CruzeError("invalid-project-name", "The project name must be a single line.");
  }
  if (name.length > MAX_LENGTH) {
    throw new CruzeError("invalid-project-name", `The project name is longer than ${MAX_LENGTH} characters.`);
  }
  return name as ProjectName;
}
