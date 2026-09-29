import { CruzeError } from "../../domain/cruze_error.ts";
import { resolveArtifact } from "../../domain/project/artifact_ref.ts";
import { PATHS } from "../../domain/project/layout.ts";
import { withVersionLine } from "../../domain/versions/cruze_version.ts";
import { withScheduledExceptions } from "../../domain/versions/scheduled_exceptions.ts";
import { appendJournal, loadView, type ProjectDeps } from "../project_context.ts";
import { realignStatus } from "./realign_status.ts";

export interface RealignDone {
  from: string;
  to: string;
  /** The change that fixes what is still open, when anything is. */
  scheduled?: string;
  /** Files listed under `check.exceptions` until that change lands. */
  excepted: string[];
}

/**
 * Moves `standards:` up to the installed Cruze once every mechanical finding is fixed, waived,
 * or scheduled in a change. A scheduled `check` finding becomes an exception naming that change,
 * so CI stays green until it lands, and landing it removes the exception.
 */
export async function realignDone(deps: ProjectDeps, options: { change?: string }): Promise<RealignDone> {
  const status = await realignStatus(deps, { full: false });
  if (status.standards === status.target) return { from: status.standards, to: status.target, excepted: [] };
  const open = status.notes.flatMap((note) => note.findings.filter((f) => !f.waived).map((f) => ({ note, finding: f })));
  let scheduled: string | undefined;
  if (open.length > 0) {
    if (options.change === undefined) {
      const list = open.map(({ note, finding }) => `${note.id}: ${finding.path}${finding.line === undefined ? "" : `:${finding.line}`}`);
      throw new CruzeError("realign-open", `fix, waive or schedule these first, then pass --change <ref> for the change that fixes the rest:\n  ${list.join("\n  ")}`);
    }
    const item = resolveArtifact(await loadView(deps.files), options.change).item;
    if (item === undefined) throw new CruzeError("not-found", `"${options.change}" is not a feature or change; create the prefactor change first`);
    scheduled = item.ref;
  }

  const excepted = open.filter(({ note }) => note.detect?.startsWith("check:") === true).map(({ note, finding }) => ({ path: finding.path, note: note.id }));
  const config = (await deps.files.readText(PATHS.config)) ?? "";
  const withExceptions = scheduled === undefined ? config : withScheduledExceptions(config, status.target, scheduled, excepted);
  await deps.files.writeText(PATHS.config, withVersionLine(withExceptions, "standards", status.target));
  const paths = [...new Set(excepted.map((e) => e.path))];
  await appendJournal(deps, ".cruze", "realign", { from: status.standards, to: status.target, ...(scheduled === undefined ? {} : { scheduled }), excepted: paths });
  return { from: status.standards, to: status.target, ...(scheduled === undefined ? {} : { scheduled }), excepted: paths };
}
