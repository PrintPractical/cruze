import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { approveArtifact } from "../src/app/use_cases/approve_artifact.ts";
import { checkBuildGate, showStatus } from "../src/app/use_cases/project_status.ts";
import { recordEvent } from "../src/app/use_cases/journal_events.ts";
import { completeTask } from "../src/app/use_cases/record_progress.ts";
import { CruzeError } from "../src/domain/cruze_error.ts";
import { BRANCH_01, CHANGE_01, CHANGE_01_PATH, FEATURE, FEATURE_PATH, approveDesign, edit, exampleProject } from "./support/harness.ts";

const rejectsWith = (code: string) => (error: unknown) => error instanceof CruzeError && error.code === code;

describe("approvals and the build gate", () => {
  it("blocks building until the change, its feature and the architecture are approved on this branch", async () => {
    const h = await exampleProject();
    h.repository.branch = BRANCH_01;
    assert.equal((await checkBuildGate(h.deps)).passed, false);

    await approveDesign(h.deps);
    await approveArtifact(h.deps, CHANGE_01);
    const gate = await checkBuildGate(h.deps);
    assert.deepEqual(gate.reasons, []);
    assert.equal(gate.passed, true);
  });

  it("refuses to approve a change before its feature", async () => {
    const h = await exampleProject();
    await approveArtifact(h.deps, "architecture");
    await assert.rejects(approveArtifact(h.deps, CHANGE_01), rejectsWith("upstream-not-approved"));
  });

  it("refuses to approve a document that breaks the formats, naming each problem", async () => {
    const h = await exampleProject();
    edit(h.files, "docs/architecture.md", "- Direction: driven", "- Direction: sideways");
    await assert.rejects(approveArtifact(h.deps, "architecture"), (e: unknown) => e instanceof CruzeError && /Direction must be one of/.test(e.message));
  });

  it("treats an approval with no journal entry as unapproved", async () => {
    const h = await exampleProject();
    await approveArtifact(h.deps, "vision");
    h.files.files.set(".cruze/journal.jsonl", "");
    const vision = (await showStatus(h.deps)).documents.find((d) => d.artifact === "docs/vision.md");
    assert.equal(vision?.state, "unapproved");
    assert.equal(vision?.unjournaled, true);
  });

  it("passes the gate with an override and journals the reason", async () => {
    const h = await exampleProject();
    h.repository.branch = BRANCH_01;
    const gate = await checkBuildGate(h.deps, "spike to measure serial latency");
    assert.equal(gate.passed, true);
    assert.equal(gate.overridden, true);
    assert.match(h.files.files.get(".cruze/features/2026-09-25-open-console/changes/01-local-serial/journal.jsonl") ?? "", /"event":"override".*spike to measure/);
  });

  // my_toolkit could not go back to architecture once building had started.
  it("rewinds to the architecture mid-build by editing it, keeping finished tasks", async () => {
    const h = await exampleProject();
    await approveDesign(h.deps);
    h.repository.branch = BRANCH_01;
    await approveArtifact(h.deps, CHANGE_01);
    await completeTask(h.deps, "T1", {});
    await completeTask(h.deps, "T2", {});

    edit(h.files, "docs/architecture.md", "keystrokes from the user", "keystrokes from the user, in the order typed");
    const blocked = await checkBuildGate(h.deps);
    assert.equal(blocked.passed, false);
    assert.ok(blocked.reasons.some((r) => r.includes(CHANGE_01_PATH) && r.includes("PORT-access.terminal")));

    await recordEvent(h.deps, "rethink", { level: "architecture", kind: "discovery", summary: "input order is part of the contract", wrong: "PORT-access.terminal", caught_by: "plan" }, CHANGE_01);
    for (const ref of ["architecture", FEATURE, CHANGE_01]) await approveArtifact(h.deps, ref);
    assert.equal((await checkBuildGate(h.deps)).passed, true);
    const change = (await showStatus(h.deps)).features[0]?.changes[0];
    assert.equal(change?.tasksDone, 2);
  });

  // my_toolkit's re-review after a kickback failed on review IDs and epochs.
  it("re-approves after repeated amendments, with no epochs or ID collisions", async () => {
    const h = await exampleProject();
    await approveDesign(h.deps);
    h.repository.branch = BRANCH_01;
    await approveArtifact(h.deps, CHANGE_01);

    for (const [from, to] of [["within 2 seconds", "within 1 second"], ["within 1 second", "within 3 seconds"]] as const) {
      edit(h.files, FEATURE_PATH, from, to);
      const stale = await showStatus(h.deps);
      assert.equal(stale.features[0]?.approval.state, "edited");
      assert.deepEqual(stale.features[0]?.changes[0]?.approval.changed, [`doc:${FEATURE_PATH}`]);
      await approveArtifact(h.deps, FEATURE);
      await approveArtifact(h.deps, CHANGE_01);
      assert.equal((await checkBuildGate(h.deps)).passed, true);
    }
  });

  it("records a planned status on architecture elements that have none when approved", async () => {
    const h = await exampleProject();
    edit(h.files, "docs/architecture.md", "- File: `src/access/app/run_command.rs`\n- Status: planned", "- File: `src/access/app/run_command.rs`");
    const report = await approveArtifact(h.deps, "architecture");
    assert.deepEqual(report.stamped, ["UC-access.run-command"]);
    assert.match(h.files.files.get("docs/architecture.md") ?? "", /run_command\.rs`\n- Status: planned/);
  });
});
