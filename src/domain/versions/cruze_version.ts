/** Which Cruze a project runs: recorded in `.cruze/config.yaml` by `cruze install`, compared with the CLI. */

/** Orders two versions such as `0.0.1` and `0.1.0` by their numeric parts; a pre-release tag is ignored. */
export function compareVersions(a: string, b: string): number {
  const parts = (v: string): number[] => (v.split("-")[0] ?? "").split(".").map((p) => Number.parseInt(p, 10) || 0);
  const [x, y] = [parts(a), parts(b)];
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    const diff = (x[i] ?? 0) - (y[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

export type VersionSkew =
  | { kind: "unrecorded"; message: string }
  | { kind: "skills-older"; recorded: string; message: string }
  | { kind: "cli-older"; recorded: string; message: string };

/** How the project's recorded Cruze differs from the CLI running now, or undefined when they match. */
export function versionSkew(cli: string, recorded: string | undefined): VersionSkew | undefined {
  if (recorded === undefined) {
    return { kind: "unrecorded", message: `the project doesn't record which Cruze its skills came from; run \`cruze install\` to install the skills of this CLI (${cli}) and record it` };
  }
  const order = compareVersions(recorded, cli);
  if (order < 0) {
    return { kind: "skills-older", recorded, message: `the project's skills are from Cruze ${recorded}, older than this CLI (${cli}); run \`cruze install\` to update them and the CI pin` };
  }
  if (order > 0) {
    return { kind: "cli-older", recorded, message: `the project uses Cruze ${recorded}, newer than this CLI (${cli}); upgrade the CLI as the README's "Upgrading" section says` };
  }
  return undefined;
}

const RECORD = /^cruze:.*$/m;

/**
 * The config text with `cruze:` set to the version. The line is replaced in place, or added
 * after `version:`, so the file's comments and layout survive.
 */
export function withRecordedVersion(configText: string, version: string): string {
  const line = `cruze: ${JSON.stringify(version)}`;
  if (RECORD.test(configText)) return configText.replace(RECORD, line);
  const at = /^version:.*$/m.exec(configText);
  if (at === null) return `${line}\n${configText}`;
  const end = at.index + at[0].length;
  return `${configText.slice(0, end)}\n${line}${configText.slice(end)}`;
}
