import { CruzeError } from "../cruze_error.ts";
import type { JournalEntry } from "../journal.ts";
import type { WorkItem } from "../project/work_items.ts";
import type { ApprovalStatus } from "./evaluate.ts";

/**
 * Why an approval was given without the user: a plan whose review closed, or work that a
 * rethink left unchanged while something it cites moved. The user can still object, and
 * editing the document makes the approval stale as usual.
 */
export type AgentBasis = "plan-review" | "rethink";

const byTime = (a: JournalEntry, b: JournalEntry): number => a.at.localeCompare(b.at);

/**
 * A feature's change may be approved by the agent once its plan review has closed: a review
 * recorded since the change was last approved, no blocker left open in its last round, and a
 * disposition for every finding of its first round. The feature's design, and a standalone
 * change's, stay the user's to approve.
 */
export function requirePlanReviewClosed(journal: JournalEntry[], item: WorkItem): void {
  if (item.kind !== "change") {
    throw new CruzeError("needs-user", `${item.ref} carries design, so the user approves it; only a feature's change can be approved after its plan review`);
  }
  const entries = journal.filter((e) => e["item"] === item.ref || e["artifact"] === item.path).sort(byTime);
  const lastApproval = entries.filter((e) => e.event === "approve").at(-1);
  const reviews = entries.filter((e) => e.event === "review" && e["review"] === "plan" && (lastApproval === undefined || e.at > lastApproval.at));
  const last = reviews.at(-1);
  if (last === undefined) {
    const since = lastApproval === undefined ? "" : " since the change was last approved";
    throw new CruzeError("plan-review-open", `no plan review is recorded for ${item.ref}${since}; run the plan review first`);
  }
  const blockers = Number(last["blockers"] ?? 0);
  if (blockers > 0 && Number(last["round"]) === 1) {
    throw new CruzeError("plan-review-open", `the plan review's round 1 found ${blockers} blocker(s); check their fixes in round 2`);
  }
  if (blockers > 0) {
    throw new CruzeError("plan-review-open", `round 2 left ${blockers} blocker(s) open; the user decides them and approves the plan`);
  }
  const first = reviews.filter((e) => Number(e["round"]) === 1).at(-1) ?? last;
  const findings = Number(first["blockers"] ?? 0) + Number(first["concerns"] ?? 0);
  const decided = entries.filter((e) => e.event === "disposition" && e["review"] === "plan" && e.at > first.at).length;
  if (decided < findings) {
    throw new CruzeError("plan-review-open", `the plan review raised ${findings} finding(s) but ${decided} have a disposition; record one for each`);
  }
}

/**
 * A rethink may re-approve, for the user, a feature or change it didn't edit: one whose own
 * design is unchanged and that is stale only because something it cites changed. A change
 * with a task reopened since its approval goes back to the user.
 */
export function requireUnchangedSinceApproval(journal: JournalEntry[], item: WorkItem | undefined, path: string, status: ApprovalStatus): void {
  if (item === undefined) {
    throw new CruzeError("needs-user", `${path} is a project document, so the user re-approves it; a rethink re-stamps only features and changes`);
  }
  if (status.state === "edited") {
    throw new CruzeError("needs-user", `${item.ref} itself changed since its approval, so the user re-approves it`);
  }
  if (status.state !== "upstream-changed") {
    throw new CruzeError("not-stale", `${item.ref} is ${status.state}; only work whose upstream changed can be re-stamped`);
  }
  const approvedAt = journal.filter((e) => e.event === "approve" && e["artifact"] === path).sort(byTime).at(-1)?.at ?? "";
  const reopened = journal.filter((e) => e.event === "reopen" && e["change"] === item.ref && e.at > approvedAt).map((e) => String(e["task"]));
  if (reopened.length > 0) {
    throw new CruzeError("needs-user", `${item.ref} had ${reopened.join(", ")} reopened since its approval, so the user re-approves it`);
  }
}
