import { CruzeError } from "../../domain/cruze_error.ts";
import { resolveArtifact } from "../../domain/project/artifact_ref.ts";
import { scopeView, type ScopeView } from "../../domain/project/scope_view.ts";
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
  return { ...scope, dispositions };
}
