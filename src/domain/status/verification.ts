import type { JournalEntry } from "../journal.ts";
import type { WorkItem } from "../project/work_items.ts";

/**
 * Whether the user accepted a change at verify. The latest verification recorded for the change
 * counts. A later approval keeps it only when the change's own design is unchanged, as when it is
 * re-approved because something upstream moved; a changed plan means verifying again. Land's
 * re-stamps don't count, since they follow the merge; an approval the agent gave does.
 */
export function isVerified(journal: JournalEntry[], change: WorkItem): boolean {
  const byTime = (a: JournalEntry, b: JournalEntry): number => a.at.localeCompare(b.at);
  const verification = journal.filter((e) => e.event === "verification" && e["item"] === change.ref).sort(byTime).at(-1);
  if (verification?.["result"] !== "accepted") return false;
  const approvals = journal.filter((e) => e.event === "approve" && e["artifact"] === change.path && !String(e["basis"] ?? "").startsWith("land ")).sort(byTime);
  const verifiedHash = approvals.filter((e) => e.at < verification.at).at(-1)?.["hash"];
  return approvals.filter((e) => e.at > verification.at).every((e) => e["hash"] === verifiedHash);
}

/**
 * Whether verify sent the change back for a rethink that hasn't been recorded yet. Tasks the
 * agent reopens at verify would otherwise make the change look ready to build again.
 */
export function awaitsRethink(journal: JournalEntry[], change: WorkItem, feature: WorkItem | undefined): boolean {
  const verification = journal.filter((e) => e.event === "verification" && e["item"] === change.ref).sort((a, b) => a.at.localeCompare(b.at)).at(-1);
  if (verification?.["result"] !== "sent-back" || verification["back_to"] !== "rethink") return false;
  // An architecture-level rethink records no item, and counts too.
  const refs = new Set([change.ref, feature?.ref, undefined]);
  return !journal.some((e) => e.event === "rethink" && e.at > verification.at && refs.has(e["item"] as string | undefined));
}
