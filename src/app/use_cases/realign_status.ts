import { CruzeError } from "../../domain/cruze_error.ts";
import type { CruzeConfig } from "../../domain/config.ts";
import { PATHS } from "../../domain/project/layout.ts";
import type { ProjectView } from "../../domain/project/project_view.ts";
import { validateProject } from "../../domain/validation/validate_project.ts";
import { notesBetween, parseRealignNotes, type RealignNote } from "../../domain/versions/realign_notes.ts";
import { FIRST_RELEASE } from "../../domain/versions/rule_versions.ts";
import type { Bundle } from "../ports/bundle.ts";
import { loadView, type ProjectDeps } from "../project_context.ts";
import { checkCode } from "./check_code.ts";

export const REALIGN_SKILL = "realign";

export interface RealignFinding {
  path: string;
  line?: number;
  message: string;
  /** Waived by an earlier realign, so never raised again. */
  waived: boolean;
}

export interface RealignNoteReport extends RealignNote {
  /** What the note's CLI rule reports now, for a note with `Detect`. */
  findings: RealignFinding[];
}

export interface RealignStatus {
  /** The version the code meets now, and the one the installed skills expect. */
  standards: string;
  target: string;
  full: boolean;
  /** Notes for existing code: those with findings to fix, waive or schedule, and those an auditor answers. */
  notes: RealignNoteReport[];
  /** Notes that change only new work, so nothing existing has to move. */
  newWorkOnly: string[];
  /** Mechanical findings not yet waived. */
  open: number;
}

/**
 * What realigning the project to its installed Cruze involves: the notes of every release
 * since `standards:`, or of all releases with `full`, and what their CLI rules find now.
 */
export async function realignStatus(deps: ProjectDeps, options: { full: boolean }): Promise<RealignStatus> {
  const view = await loadView(deps.files);
  const config = requireInstalled(view, deps.bundle.version);
  const standards = config.standards ?? FIRST_RELEASE;
  const target = deps.bundle.version;
  const notes = notesBetween(await bundledNotes(deps.bundle), options.full ? "0.0.0" : standards, target);
  const waived = waivedFindings(view);
  const check = (await checkCode(deps, { ci: false })).findings;
  const problems = validateProject(view);
  const report = notes.filter((n) => n.appliesTo === "existing").map((note): RealignNoteReport => {
    const [command, rule] = (note.detect ?? ":").split(":");
    const found = command === "check" ? check.filter((f) => f.rule === rule) : command === "validate" ? problems.filter((p) => p.rule === rule) : [];
    const findings = found.map((f) => ({
      path: f.path,
      ...(f.line === undefined ? {} : { line: f.line }),
      message: f.message,
      // A check finding is waived by listing the file under check.exceptions, which also keeps CI green.
      waived: command === "validate" && waived.has(findingKey(note.id, f.path)),
    }));
    return { ...note, findings };
  });
  return {
    standards,
    target,
    full: options.full,
    notes: report,
    newWorkOnly: notes.filter((n) => n.appliesTo === "new").map((n) => n.id),
    open: report.flatMap((n) => n.findings).filter((f) => !f.waived).length,
  };
}

/** The key a realign disposition records for a mechanical finding, so a waiver can be matched later. */
export function findingKey(note: string, path: string): string {
  return `${note}: ${path}`;
}

/** The project's config, once its skills come from this CLI; realign works from the installed notes. */
export function requireInstalled(view: ProjectView, version: string): CruzeConfig {
  const config = view.config?.config;
  if (config === null || config === undefined) throw new CruzeError("config", `fix ${PATHS.config} first; run cruze validate for details`);
  if (config.cruze !== version) {
    throw new CruzeError("install-first", `the project's skills are from Cruze ${config.cruze ?? "an unrecorded version"}, and this CLI is ${version}; run cruze install first`);
  }
  return config;
}

async function bundledNotes(bundle: Bundle): Promise<RealignNote[]> {
  const skill = (await bundle.skills()).find((s) => s.folder === REALIGN_SKILL);
  return (skill?.files ?? [])
    .flatMap((file) => {
      const version = /^notes\/(\d+\.\d+\.\d+)\.md$/.exec(file.path)?.[1];
      return version === undefined ? [] : parseRealignNotes(version, file.text).notes;
    });
}

/** Findings earlier realigns waived, by key. */
function waivedFindings(view: ProjectView): Set<string> {
  return new Set(
    view.journal
      .filter((e) => e.event === "disposition" && e["review"] === "realign" && e["disposition"] === "waived")
      .map((e) => String(e["finding"])),
  );
}
