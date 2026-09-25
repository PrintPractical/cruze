import { CruzeError } from "../../domain/cruze_error.ts";
import { recordedEventProblems, type JournalEntry } from "../../domain/journal.ts";
import { resolveArtifact } from "../../domain/project/artifact_ref.ts";
import { appendJournal, loadView, type ProjectDeps } from "../project_context.ts";

/** Records an event a skill observed: a rethink, a review round, a disposition, an override or a bug. */
export async function recordEvent(deps: ProjectDeps, event: string, fields: Record<string, string>, item?: string): Promise<JournalEntry> {
  const problems = recordedEventProblems(event, fields);
  if (problems.length > 0) throw new CruzeError("invalid-event", problems.join("; "));
  let folder = ".cruze";
  if (item !== undefined) {
    const resolved = resolveArtifact(await loadView(deps.files), item).item;
    if (resolved === undefined) throw new CruzeError("not-found", `"${item}" is not a feature or change`);
    folder = resolved.folder;
    fields = { ...fields, item: resolved.ref };
  }
  return appendJournal(deps, folder, event, { ...fields, cruze: deps.bundle.version });
}

export async function listEvents(deps: ProjectDeps, event?: string): Promise<JournalEntry[]> {
  const { journal } = await loadView(deps.files);
  return event === undefined ? journal : journal.filter((entry) => entry.event === event);
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
