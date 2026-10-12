import type { JournalEntry } from "../journal.ts";
import type { WorkItem } from "../project/work_items.ts";

/**
 * Findings decided `rethink` for a feature or change that no rethink of it has followed yet.
 * One project's realign recorded seven design findings on a feature as fixed "by a rethink before
 * its next change is planned"; nothing showed them, and they surfaced only in a commit message.
 */
export function pendingRethinks(journal: JournalEntry[], item: WorkItem): JournalEntry[] {
  const lastRethink = journal
    .filter((e) => e.event === "rethink" && e["item"] === item.ref)
    .map((e) => e.at)
    .sort()
    .at(-1);
  return journal.filter((e) => e.event === "disposition" && e["disposition"] === "rethink" && e["item"] === item.ref && (lastRethink === undefined || e.at > lastRethink));
}

/** Why work waits on a rethink, naming the first finding. */
export function pendingReason(item: WorkItem, pending: JournalEntry[]): string {
  const more = pending.length > 1 ? ` and ${pending.length - 1} more` : "";
  return `${pending.length} finding(s) on ${item.ref} were decided for a rethink that hasn't happened yet: ${String(pending[0]?.["finding"] ?? "")}${more}`;
}
