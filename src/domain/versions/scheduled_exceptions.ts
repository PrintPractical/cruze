import { parseDocument, type Document } from "yaml";

/**
 * `check.exceptions` entries that `realign` adds for findings a prefactor change will fix,
 * and that landing that change removes. Edited through the YAML document, so comments survive.
 */

export interface Scheduled {
  path: string;
  note: string;
}

const scheduledReason = (version: string, note: string, ref: string): string => `realign ${version} (${note}): scheduled in ${ref}`;

/** The config text with an exception for each finding, naming the change that will fix it. */
export function withScheduledExceptions(configText: string, version: string, ref: string, findings: Scheduled[]): string {
  if (findings.length === 0) return configText;
  const doc = parseDocument(configText);
  const listed = new Set(((doc.getIn(["check", "exceptions"]) as { toJSON(): Array<{ path?: string }> } | undefined)?.toJSON() ?? []).map((e) => e.path));
  for (const finding of findings.filter((f, i) => !listed.has(f.path) && findings.findIndex((o) => o.path === f.path) === i)) {
    doc.addIn(["check", "exceptions"], doc.createNode({ path: finding.path, reason: scheduledReason(version, finding.note, ref) }));
  }
  return render(doc);
}

/** The config text without the exceptions scheduled in a change, once it lands; unchanged when it had none. */
export function withoutScheduledExceptions(configText: string, ref: string): { text: string; removed: string[] } {
  const doc = parseDocument(configText);
  const exceptions = doc.getIn(["check", "exceptions"]) as { items: Array<{ toJSON(): { path?: string; reason?: string } }> } | undefined;
  if (exceptions === undefined || !Array.isArray(exceptions.items)) return { text: configText, removed: [] };
  const suffix = `: scheduled in ${ref}`;
  const removed = exceptions.items.map((item) => item.toJSON()).filter((e) => e.reason?.endsWith(suffix)).map((e) => e.path ?? "");
  if (removed.length === 0) return { text: configText, removed: [] };
  exceptions.items = exceptions.items.filter((item) => !(item.toJSON().reason ?? "").endsWith(suffix));
  return { text: render(doc), removed };
}

/** Renders without wrapping long lines or padding flow lists, so an edit changes only what it touches. */
function render(doc: Document): string {
  return doc.toString({ lineWidth: 0, flowCollectionPadding: false });
}
