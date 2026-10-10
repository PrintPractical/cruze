import { CruzeError } from "../../domain/cruze_error.ts";
import { journalPath, parseJournal, recordedEventProblems, recordedFields, type JournalEntry } from "../../domain/journal.ts";
import { resolveArtifact } from "../../domain/project/artifact_ref.ts";
import { appendJournal, loadView, type ProjectDeps } from "../project_context.ts";

/** Records an event a skill observed: a rethink, a review round, a disposition, an override or a bug. */
export async function recordEvent(deps: ProjectDeps, event: string, fields: Record<string, string>, item?: string): Promise<JournalEntry> {
  const problems = recordedEventProblems(event, fields);
  if (problems.length > 0) throw new CruzeError("invalid-event", problems.join("; "));
  let folder = ".cruze";
  let recorded = recordedFields(fields);
  if (item !== undefined) {
    const resolved = resolveArtifact(await loadView(deps.files), item).item;
    if (resolved === undefined) throw new CruzeError("not-found", `"${item}" is not a feature or change`);
    folder = resolved.folder;
    recorded = { ...recorded, item: resolved.ref };
  }
  return appendJournal(deps, folder, event, { ...recorded, cruze: deps.bundle.version });
}

/**
 * The journal of the work in flight and the project, or of one feature or change (a feature's changes' too).
 * Landed work's entries are history, listed only with `all`, since every entry ever recorded is too much to read.
 */
export async function listEvents(deps: ProjectDeps, event?: string, item?: string, all = false): Promise<JournalEntry[]> {
  const view = await loadView(deps.files);
  let folders = [".cruze", ...view.items.filter((i) => all || !i.archived).map((i) => i.folder)];
  if (item !== undefined) {
    const resolved = resolveArtifact(view, item).item;
    if (resolved === undefined) throw new CruzeError("not-found", `"${item}" is not a feature or change`);
    folders = [resolved, ...view.items.filter((i) => resolved.kind === "feature" && i.featureRef === resolved.ref)].map((part) => part.folder);
  }
  const entries = folders.flatMap((folder) => parseJournal(view.snapshot.get(journalPath(folder))).entries).sort((a, b) => a.at.localeCompare(b.at));
  return event === undefined ? entries : entries.filter((entry) => entry.event === event);
}

export interface FeedbackExport {
  format: "cruze-feedback/1";
  cruze: string;
  exported_at: string;
  redacted: boolean;
  entries: JournalEntry[];
}

/**
 * Bundles the journal for the framework feedback loop. By default the project name and
 * the approver's identity are redacted, since the bundle may leave the project.
 */
export async function exportFeedback(deps: ProjectDeps, redact: boolean): Promise<FeedbackExport> {
  const view = await loadView(deps.files);
  const project = view.config?.config?.project ?? "";
  const scrub = (value: unknown): unknown => {
    if (typeof value === "string") return project === "" ? value : value.split(project).join("<project>");
    if (Array.isArray(value)) return value.map(scrub);
    if (value !== null && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, scrub(v)]));
    return value;
  };
  const entries = redact ? view.journal.map((entry) => ({ ...(scrub(entry) as JournalEntry), by: "<redacted>" })) : view.journal;
  return { format: "cruze-feedback/1", cruze: deps.bundle.version, exported_at: deps.clock.now().toISOString(), redacted: redact, entries };
}
