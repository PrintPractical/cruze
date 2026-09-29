import { compareVersions } from "./cruze_version.ts";

/** The first release of Cruze. A project that records no `standards:` meets its expectations. */
export const FIRST_RELEASE = "0.0.1";

/**
 * The release that introduced each rule reporting on existing code, keyed as `<command>:<rule>`.
 * A rule newer than the project's `standards:` still reports, but can't fail CI until the project realigns.
 * Every entry needs a realign note in `skills/realign/notes/<version>.md`; the bundle lint checks it.
 */
export const RULE_SINCE: Record<string, string> = {
  "check:test-placement": "0.0.2",
  "validate:outside-module-map": "0.0.2",
  "validate:readme-overview": "0.0.2",
  "validate:feature-size": "0.0.2",
};

/** Whether a rule arrived after the version the project's code meets, so it waits for `realign`. */
export function isPending(command: "check" | "validate", rule: string, standards: string): boolean {
  const since = RULE_SINCE[`${command}:${rule}`];
  return since !== undefined && compareVersions(since, standards) > 0;
}
