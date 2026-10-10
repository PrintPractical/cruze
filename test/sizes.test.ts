import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { approveArtifact } from "../src/app/use_cases/approve_artifact.ts";
import { validate } from "../src/app/use_cases/validate_project.ts";
import { CruzeError } from "../src/domain/cruze_error.ts";
import { CHANGE_01, CHANGE_01_PATH, CHANGE_02, FEATURE, FEATURE_PATH, approveDesign, edit, exampleProject, type Harness } from "./support/harness.ts";

const rejectsWith = (code: string) => (error: unknown) => error instanceof CruzeError && error.code === code;

/** Drops the fixture's lower band, so its second change falls under the default of 3 elements. */
function makeChangeTooSmall(h: Harness): void {
  edit(h.files, ".cruze/config.yaml", "changes:\n  min_builds: 2\n", "changes:\n");
}

function accept(h: Harness, ref: string): void {
  edit(h.files, ".cruze/config.yaml", "changes:\n", `changes:\n  exceptions:\n    - item: ${ref}\n      reason: it continues no other change, and the user chose to keep it\n`);
}

// Ork approved three changes of 33, 33 and 51 scenarios with decisions recording the user's acceptance, and
// validate warned about them on every run after, because nothing it reads holds an acceptance.
describe("size warnings the user accepted", () => {
  it("stop reporting once the item is listed under changes.exceptions with a reason", async () => {
    const h = await exampleProject();
    makeChangeTooSmall(h);
    const warnings = async () => (await validate(h.deps)).problems.filter((p) => p.rule === "change-too-small").map((p) => p.message);
    assert.match((await warnings())[0] ?? "", /02-ssh-hops builds 2 element/);
    accept(h, CHANGE_02);
    assert.deepEqual(await warnings(), []);
    assert.deepEqual((await validate(h.deps)).problems, []);
  });

  it("refuse an exception without a reason", async () => {
    const h = await exampleProject();
    edit(h.files, ".cruze/config.yaml", "changes:\n", `changes:\n  exceptions:\n    - item: ${CHANGE_02}\n`);
    const problems = (await validate(h.deps)).problems.filter((p) => p.rule === "config");
    assert.match(problems[0]?.message ?? "", /changes.exceptions\[0\] needs an item and a non-empty reason/);
  });

  // A 28-task change was approved over its plan-too-large warning and went on to record 26 deviations.
  it("block approval until the work is split or the acceptance is recorded", async () => {
    const h = await exampleProject();
    makeChangeTooSmall(h);
    await approveArtifact(h.deps, "vision");
    await approveArtifact(h.deps, "architecture");
    await approveArtifact(h.deps, "roadmap");
    await assert.rejects(approveArtifact(h.deps, FEATURE), (e: unknown) => rejectsWith("size-unaccepted")(e) && /changes.exceptions/.test((e as Error).message));
    accept(h, CHANGE_02);
    assert.equal((await approveArtifact(h.deps, FEATURE)).artifact, FEATURE_PATH);
  });

  it("block a plan's approval the same way, by the change's own ref", async () => {
    const h = await exampleProject();
    await approveDesign(h.deps);
    edit(h.files, ".cruze/config.yaml", "changes:\n  min_builds: 2\n", "changes:\n  min_builds: 2\n  max_tasks: 3\n");
    h.repository.branch = "open-console-local-serial";
    await assert.rejects(approveArtifact(h.deps, CHANGE_01), rejectsWith("size-unaccepted"));
    edit(h.files, ".cruze/config.yaml", "  max_tasks: 3\n", `  max_tasks: 3\n  exceptions:\n    - item: ${CHANGE_01}\n      reason: the user accepts one long plan for the skeleton\n`);
    assert.equal((await approveArtifact(h.deps, CHANGE_01)).artifact, CHANGE_01_PATH);
  });
});
