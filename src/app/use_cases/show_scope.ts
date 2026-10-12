import { CruzeError } from "../../domain/cruze_error.ts";
import { resolveArtifact } from "../../domain/project/artifact_ref.ts";
import { scopeOf } from "../../domain/ids.ts";
import { notesFor, readNotes, type NotesFor } from "../../domain/project/notes.ts";
import { scopeView, type ScopeView } from "../../domain/project/scope_view.ts";
import type { WorkItem } from "../../domain/project/work_items.ts";
import { loadView, type ProjectDeps } from "../project_context.ts";
import { listEvents } from "./journal_events.ts";

export interface Disposition {
  finding: string;
  disposition: string;
  reason: string;
  review: string;
}

export interface ScopeReport extends ScopeView {
  /** The settled ledger of the item: the feature's dispositions and its changes', or a standalone change's. */
  dispositions: Disposition[];
  /** The external documents the design must comply with, from `references:` in `.cruze/config.yaml`. */
  references: Array<{ path: string; use: string }>;
  /** The notes about this work, and the parts of the user's input handed to it. */
  notes: NotesFor;
}

/**
 * The design a change builds, or a feature's whole delta, with the elements it cites and the
 * item's settled ledger: what plan, build and the reviewers read instead of the whole living docs.
 */
export async function showScope(deps: ProjectDeps, ref: string): Promise<ScopeReport> {
  const view = await loadView(deps.files);
  const { item } = resolveArtifact(view, ref);
  if (item === undefined) throw new CruzeError("not-work", `"${ref}" is not a feature or change; show takes a feature or change ID`);
  const scope = scopeView(view, item);
  const dispositions = (await listEvents(deps, "disposition", scope.feature ?? item.ref, true)).map((entry) => ({
    finding: String(entry["finding"] ?? ""),
    disposition: String(entry["disposition"] ?? ""),
    reason: String(entry["reason"] ?? ""),
    review: String(entry["review"] ?? ""),
  }));
  const feature = scope.feature === undefined ? item : (view.items.find((i) => i.ref === scope.feature) ?? item);
  const contexts = [...scope.elements, ...scope.scenarios].flatMap((e) => scopeOf(e.id) ?? []);
  const notes = notesFor(readNotes(view.snapshot), [...slugsOf(feature), ...contexts]);
  return { ...scope, dispositions, references: view.config?.config?.references ?? [], notes };
}

/** The names a note or a hand-off may use for a feature or standalone change: its roadmap slug, and its folder name without the date. */
export function slugsOf(item: WorkItem): string[] {
  const roadmap = item.doc.frontmatter?.["roadmap"];
  return [...new Set([...(typeof roadmap === "string" ? [roadmap] : []), item.folderName.replace(/^\d{4}-\d{2}-\d{2}-/, "")])];
}
