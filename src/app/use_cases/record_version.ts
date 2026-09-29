import { CruzeError } from "../../domain/cruze_error.ts";
import { PATHS } from "../../domain/project/layout.ts";
import { repinCruze } from "../../domain/versions/ci_pin.ts";
import { compareVersions, versionSkew, withRecordedVersion } from "../../domain/versions/cruze_version.ts";
import type { ProjectFiles } from "../ports/project_files.ts";

export const CI_WORKFLOW = ".github/workflows/ci.yml";

export interface VersionRecord {
  /** The version the project recorded before, when it recorded one. */
  from?: string;
  to: string;
  /** The CI workflow's Cruze specs after the edit, and those left for the user to move. */
  ci: { repinned: string[]; unrecognised: string[] };
}

/** The version the project's config records, read without requiring the rest of the config to be valid. */
export async function recordedVersion(files: ProjectFiles): Promise<string | undefined> {
  const text = await files.readText(PATHS.config);
  return text === undefined ? undefined : versionIn(text);
}

/** What to tell the user when a Cruze project's skills don't match this CLI; nothing outside a Cruze project. */
export async function versionNotice(files: ProjectFiles, version: string): Promise<string | undefined> {
  const text = await files.readText(PATHS.config);
  return text === undefined ? undefined : versionSkew(version, versionIn(text))?.message;
}

function versionIn(configText: string): string | undefined {
  return /^cruze:\s*["']?([^"'\s#]+)/m.exec(configText)?.[1];
}

/** Refuses to install older skills over a project that already moved to a newer Cruze. */
export async function refuseDowngrade(files: ProjectFiles, version: string): Promise<void> {
  const recorded = await recordedVersion(files);
  if (recorded !== undefined && compareVersions(recorded, version) > 0) {
    throw new CruzeError(
      "older-cli",
      `this project uses Cruze ${recorded}, and this CLI is ${version}; upgrade the CLI instead. To go back to ${version} on purpose, set cruze: in ${PATHS.config} first`,
    );
  }
}

/** Records the installed version in the config, and moves the CI workflow's Cruze to it. */
export async function recordVersion(files: ProjectFiles, version: string): Promise<VersionRecord> {
  const from = await recordedVersion(files);
  const config = await files.readText(PATHS.config);
  if (config !== undefined) {
    const updated = withRecordedVersion(config, version);
    if (updated !== config) await files.writeText(PATHS.config, updated);
  }
  const ci = await files.readText(CI_WORKFLOW);
  const repin = ci === undefined ? { text: "", repinned: [], unrecognised: [] } : repinCruze(ci, version);
  if (ci !== undefined && repin.text !== ci) await files.writeText(CI_WORKFLOW, repin.text);
  return { ...(from === undefined ? {} : { from }), to: version, ci: { repinned: repin.repinned, unrecognised: repin.unrecognised } };
}
