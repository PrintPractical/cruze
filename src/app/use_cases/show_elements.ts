import { CruzeError } from "../../domain/cruze_error.ts";
import { elementIndex, lookupElements, type ElementIndex } from "../../domain/project/element_lookup.ts";
import type { ShownElement } from "../../domain/project/scope_view.ts";
import { loadView, type ProjectDeps } from "../project_context.ts";

/** The bodies of the named elements, living and in each in-flight delta that changes them. */
export async function showElements(deps: ProjectDeps, ids: string[]): Promise<{ elements: ShownElement[] }> {
  const { elements, missing } = lookupElements(await loadView(deps.files), ids);
  if (missing.length > 0) throw new CruzeError("unknown-id", `${missing.join(", ")} ${missing.length === 1 ? "is" : "are"} defined nowhere in the living docs or the work in flight; cruze show --index lists every element`);
  return { elements };
}

/** One line per element of the living architecture and specs, with what work in flight adds or changes. */
export async function showIndex(deps: ProjectDeps, scope?: string): Promise<ElementIndex & { scope?: string }> {
  const index = elementIndex(await loadView(deps.files), scope);
  if (scope !== undefined && index.entries.length === 0) throw new CruzeError("unknown-scope", `no element belongs to "${scope}"; name a context or capability, such as the part of an ID before its dot`);
  return scope === undefined ? index : { ...index, scope };
}
