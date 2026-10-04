import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { approveArtifact } from "../src/app/use_cases/approve_artifact.ts";
import { recordEvent } from "../src/app/use_cases/journal_events.ts";
import { checkBuildGate, showStatus, suggestNext } from "../src/app/use_cases/project_status.ts";
import { completeTask, reopenTask } from "../src/app/use_cases/record_progress.ts";
import { CruzeError } from "../src/domain/cruze_error.ts";
import { BRANCH_01, CHANGE_01, CHANGE_01_PATH, FEATURE, FEATURE_PATH, approveDesign, edit, exampleProject, type Harness } from "./support/harness.ts";

const rejectsWith = (code: string) => (error: unknown) => error instanceof CruzeError && error.code === code;

/** Records a plan review round for change 01, as the roles skill does. */
async function planReview(h: Harness, round: 1 | 2, blockers: number, concerns: number): Promise<void> {
  await recordEvent(h.deps, "review", { review: "plan", round: String(round), blockers: String(blockers), concerns: String(concerns), nits: "0" }, CHANGE_01);
}

async function disposition(h: Harness, finding: string, decided: "agent" | "user" = "agent"): Promise<void> {
  await recordEvent(h.deps, "disposition", { finding, disposition: "fixed", reason: "fixed as proposed", review: "plan", decided }, CHANGE_01);
}

async function designed(): Promise<Harness> {
  const h = await exampleProject();
  await approveDesign(h.deps);
  h.repository.branch = BRANCH_01;
  return h;
}

describe("approving a plan once its review closes", () => {
  it("approves a change for the user after a review with every finding decided, and the build gate accepts it", async () => {
    const h = await designed();
    await planReview(h, 1, 0, 2);
    await disposition(h, "Tasks: T3 has two owners");
    await disposition(h, "Order: T5 can't fail first", "user");

    const report = await approveArtifact(h.deps, CHANGE_01, { agent: "plan-review" });
    assert.equal(report.basis, "plan-review");
    assert.equal((await checkBuildGate(h.deps)).passed, true);
    const change = (await showStatus(h.deps)).features[0]?.changes[0];
    assert.equal(change?.approval.record?.basis, "plan-review");
    assert.match(h.files.files.get(`.cruze/features/${FEATURE}/changes/01-local-serial/approvals.json`) ?? "", /"basis": "plan-review"/);
  });

  it("refuses before any plan review is recorded", async () => {
    const h = await designed();
    await assert.rejects(approveArtifact(h.deps, CHANGE_01, { agent: "plan-review" }), rejectsWith("plan-review-open"));
  });

  it("refuses while a round-1 blocker waits for round 2, and while round 2 leaves one open", async () => {
    const h = await designed();
    await planReview(h, 1, 1, 0);
    await disposition(h, "Test plan: SCN-access.detach has no behaviour row");
    await assert.rejects(approveArtifact(h.deps, CHANGE_01, { agent: "plan-review" }), (e: unknown) => e instanceof CruzeError && /round 2/.test(e.message));

    await planReview(h, 2, 1, 0);
    await assert.rejects(approveArtifact(h.deps, CHANGE_01, { agent: "plan-review" }), (e: unknown) => e instanceof CruzeError && /the user decides them/.test(e.message));

    // The user decides the open blocker, and approves the plan themselves.
    await approveArtifact(h.deps, CHANGE_01);
    assert.equal((await checkBuildGate(h.deps)).passed, true);
  });

  it("approves once round 2 finds the blockers fixed", async () => {
    const h = await designed();
    await planReview(h, 1, 1, 1);
    await disposition(h, "Test plan: SCN-access.detach has no behaviour row");
    await disposition(h, "Risks: the riskiest task is unnamed");
    await planReview(h, 2, 0, 0);
    assert.equal((await approveArtifact(h.deps, CHANGE_01, { agent: "plan-review" })).basis, "plan-review");
  });

  it("refuses while a finding has no disposition", async () => {
    const h = await designed();
    await planReview(h, 1, 0, 2);
    await disposition(h, "Tasks: T3 has two owners");
    await assert.rejects(approveArtifact(h.deps, CHANGE_01, { agent: "plan-review" }), (e: unknown) => e instanceof CruzeError && /2 finding\(s\) but 1/.test(e.message));
  });

  it("needs a new review before approving an amended plan, and verifying again after it", async () => {
    const h = await designed();
    await planReview(h, 1, 0, 0);
    await approveArtifact(h.deps, CHANGE_01, { agent: "plan-review" });
    const text = h.files.files.get(CHANGE_01_PATH) ?? "";
    for (const task of text.matchAll(/^- (T\d+): /gm)) await completeTask(h.deps, task[1] ?? "", { change: CHANGE_01 });
    await recordEvent(h.deps, "verification", { result: "accepted", summary: "every scenario passed" }, CHANGE_01);
    assert.equal((await suggestNext(h.deps)).next.step, "land");

    edit(h.files, CHANGE_01_PATH, "asserts close order and terminal restore", "asserts close order, then terminal restore");
    await assert.rejects(approveArtifact(h.deps, CHANGE_01, { agent: "plan-review" }), (e: unknown) => e instanceof CruzeError && /since the change was last approved/.test(e.message));
    await planReview(h, 1, 0, 0);
    await approveArtifact(h.deps, CHANGE_01, { agent: "plan-review" });
    assert.equal((await suggestNext(h.deps)).next.step, "verify");
  });

  it("leaves a feature's design to the user", async () => {
    const h = await exampleProject();
    for (const ref of ["vision", "architecture", "roadmap"]) await approveArtifact(h.deps, ref);
    await assert.rejects(approveArtifact(h.deps, FEATURE, { agent: "plan-review" }), rejectsWith("needs-user"));
  });
});

describe("re-stamping what a rethink left unchanged", () => {
  /** Change 01 approved, then a feature-level rethink amends the feature and the user re-approves it. */
  async function afterFeatureRethink(): Promise<Harness> {
    const h = await designed();
    await approveArtifact(h.deps, CHANGE_01);
    edit(h.files, FEATURE_PATH, "within 2 seconds", "within 1 second");
    await approveArtifact(h.deps, FEATURE);
    return h;
  }

  it("re-stamps a change whose own design is unchanged, naming what moved", async () => {
    const h = await afterFeatureRethink();
    assert.equal((await showStatus(h.deps)).features[0]?.changes[0]?.approval.state, "upstream-changed");

    const report = await approveArtifact(h.deps, CHANGE_01, { agent: "rethink" });
    assert.equal(report.basis, "rethink");
    assert.deepEqual(report.restamped, [`doc:${FEATURE_PATH}`]);
    assert.equal((await checkBuildGate(h.deps)).passed, true);
    assert.match(h.files.files.get(`.cruze/features/${FEATURE}/changes/01-local-serial/journal.jsonl`) ?? "", /"basis":"rethink","restamped":\[".*feature\.md"\]/);
  });

  it("keeps a change's verification across a re-stamp", async () => {
    const h = await designed();
    await approveArtifact(h.deps, CHANGE_01);
    const text = h.files.files.get(CHANGE_01_PATH) ?? "";
    for (const task of text.matchAll(/^- (T\d+): /gm)) await completeTask(h.deps, task[1] ?? "", { change: CHANGE_01 });
    await recordEvent(h.deps, "verification", { result: "accepted", summary: "every scenario passed" }, CHANGE_01);
    edit(h.files, FEATURE_PATH, "within 2 seconds", "within 1 second");
    await approveArtifact(h.deps, FEATURE);
    await approveArtifact(h.deps, CHANGE_01, { agent: "rethink" });
    assert.equal((await suggestNext(h.deps)).next.step, "land");
  });

  it("leaves to the user a change the rethink edited", async () => {
    const h = await afterFeatureRethink();
    edit(h.files, CHANGE_01_PATH, "asserts close order and terminal restore", "asserts close order, then terminal restore");
    await assert.rejects(approveArtifact(h.deps, CHANGE_01, { agent: "rethink" }), rejectsWith("needs-user"));
  });

  it("leaves to the user a change with a task reopened since its approval", async () => {
    const h = await afterFeatureRethink();
    await completeTask(h.deps, "T1", { change: CHANGE_01 });
    await reopenTask(h.deps, "T1", "the timeout moved to one second", { change: CHANGE_01 });
    await assert.rejects(approveArtifact(h.deps, CHANGE_01, { agent: "rethink" }), (e: unknown) => e instanceof CruzeError && e.code === "needs-user" && /T1 reopened/.test(e.message));
  });

  it("leaves project documents to the user, and refuses work that is already current", async () => {
    const h = await afterFeatureRethink();
    await assert.rejects(approveArtifact(h.deps, "roadmap", { agent: "rethink" }), rejectsWith("needs-user"));
    await assert.rejects(approveArtifact(h.deps, FEATURE, { agent: "rethink" }), rejectsWith("not-stale"));
  });
});

describe("recording who decided a finding", () => {
  it("takes decided=agent only for a fix", async () => {
    const h = await designed();
    await disposition(h, "Tasks: T3 has two owners");
    const waive = { finding: "Risks: unnamed", disposition: "waived", reason: "accepted", review: "plan", decided: "agent" };
    await assert.rejects(recordEvent(h.deps, "disposition", waive, CHANGE_01), (e: unknown) => e instanceof CruzeError && /the user waives/.test(e.message));
    await assert.rejects(recordEvent(h.deps, "disposition", { ...waive, decided: "reviewer" }, CHANGE_01), rejectsWith("invalid-event"));
    await recordEvent(h.deps, "disposition", { ...waive, decided: "user" }, CHANGE_01);
  });
});
