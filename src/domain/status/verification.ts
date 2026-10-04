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
