import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { approveArtifact } from "../src/app/use_cases/approve_artifact.ts";
import { recordEvent } from "../src/app/use_cases/journal_events.ts";
import { landChange } from "../src/app/use_cases/land_change.ts";
import { showStatus } from "../src/app/use_cases/project_status.ts";
import { completeTask, updateFeatureSummary } from "../src/app/use_cases/record_progress.ts";
import { validate } from "../src/app/use_cases/validate_project.ts";
import { CruzeError } from "../src/domain/cruze_error.ts";
import { BRANCH_01, CHANGE_01, CHANGE_01_PATH, CHANGE_02, CHANGE_02_TEXT, FEATURE, FEATURE_PATH, approveDesign, buildChange, edit, exampleProject, type Harness } from "./support/harness.ts";

const statusOf = (h: Harness, path: string, id: string): string | undefined => {
  const text = h.files.files.get(path) ?? "";
  const block = text.slice(text.indexOf(`### ${id}:`));
  return /\n- Status: (planned|built)/.exec(block.slice(0, block.indexOf("\n#", 4) === -1 ? undefined : block.indexOf("\n#", 4)))?.[1];
};

async function landFirstChange(): Promise<Harness> {
  const h = await exampleProject();
  await approveDesign(h.deps);
  await buildChange(h, CHANGE_01, BRANCH_01);
  await landChange(h.deps, CHANGE_01);
  return h;
}

describe("landing a change", () => {
  it("merges the feature's whole delta on its first land, marking only this change's scope built", async () => {
    const h = await landFirstChange();
    const spec = h.files.files.get("docs/specs/access.md") ?? "";
    assert.match(spec, /^# Console access\n\nOpening consoles on configured devices\./);
    assert.equal(statusOf(h, "docs/specs/access.md", "SCN-access.direct-serial"), "built");
    assert.equal(statusOf(h, "docs/specs/access.md", "SCN-access.ssh-direct"), "planned");
    assert.equal(statusOf(h, "docs/architecture.md", "ENT-access.escape-detector"), "built");
    assert.equal(statusOf(h, "docs/architecture.md", "FLOW-access.hop-failure"), "planned");
    assert.equal(statusOf(h, "docs/architecture.md", "ADP-access.ssh-connector"), "planned");
    assert.match(h.files.files.get("docs/architecture.md") ?? "", /^### FLOW-access\.hop-failure: /m);
    assert.doesNotMatch(h.files.files.get("docs/architecture.md") ?? "", /### (ADDED|MODIFIED) /);
  });

  it("leaves the project valid and the remaining work approved: no false staleness", async () => {
    const h = await landFirstChange();
    assert.deepEqual((await validate(h.deps)).problems, []);
    const status = await showStatus(h.deps);
    assert.deepEqual(status.documents.map((d) => d.state), ["approved", "approved", "approved"]);
    assert.equal(status.features[0]?.approval.state, "approved");
    assert.ok(status.features[0]?.changes[0]?.landed !== undefined);
  });

  it("finishes the feature with its last change: archives it, and records it as implemented", async () => {
    const h = await landFirstChange();
    h.files.files.set(`.cruze/features/${FEATURE}/changes/02-ssh-hops/change.md`, CHANGE_02_TEXT);
    await buildChange(h, CHANGE_02, "open-console-ssh");
    const report = await landChange(h.deps, CHANGE_02);

    assert.equal(report.finished, true);
    assert.equal(report.archivedTo, `.cruze/archive/${FEATURE}`);
    assert.ok(h.files.files.has(`.cruze/archive/${FEATURE}/feature.md`));
    assert.equal(statusOf(h, "docs/specs/access.md", "SCN-access.ssh-direct"), "built");
    assert.equal(statusOf(h, "docs/architecture.md", "ADP-access.ssh-connector"), "built");
    assert.match(h.files.files.get("docs/vision.md") ?? "", /### Implemented\n\n\| Feature \| Release \| Summary \|\n\| --- \| --- \| --- \|\n\| open-console \| v0\.1 \|/);
    assert.match(h.files.files.get("docs/roadmap.md") ?? "", /\| open-console \| 2026-09-25-open-console \| landed \|/);
    assert.deepEqual((await validate(h.deps)).problems, []);
  });

  // A project's decisions replaced two policies its feature-map summary promised, and land kept the old summary.
  it("corrects a finished feature's summary on the implemented list, keeping its release and the vision's approval", async () => {
    const h = await landFirstChange();
    h.files.files.set(`.cruze/features/${FEATURE}/changes/02-ssh-hops/change.md`, CHANGE_02_TEXT);
    await buildChange(h, CHANGE_02, "open-console-ssh");
    await landChange(h.deps, CHANGE_02);

    const report = await updateFeatureSummary(h.deps, "open-console", "Interactive console over local serial and SSH hop chains, detached with an escape sequence");
    assert.deepEqual(report, { feature: "open-console", list: "Implemented" });
    assert.match(h.files.files.get("docs/vision.md") ?? "", /\| open-console \| v0\.1 \| Interactive console over local serial and SSH hop chains, detached with an escape sequence \|/);
    assert.equal((await showStatus(h.deps)).documents.find((d) => d.artifact === "docs/vision.md")?.state, "approved");
    assert.deepEqual((await validate(h.deps)).problems, []);
  });

  it("refuses to land with tasks still open, and writes nothing", async () => {
    const h = await exampleProject();
    await approveDesign(h.deps);
    h.repository.branch = BRANCH_01;
    await approveArtifact(h.deps, CHANGE_01);
    await completeTask(h.deps, "T1", {});
    const before = new Map(h.files.files);
    await assert.rejects(landChange(h.deps), (e: unknown) => e instanceof CruzeError && e.code === "not-ready" && /tasks not done: T2/.test(e.message));
    assert.deepEqual(h.files.files, before);
  });

  // mw-configuration-service: landing a removal left the feature citing a retired scenario.
  it("refuses a land that would leave the feature citing an ID it removes, and writes nothing", async () => {
    const h = await exampleProject();
    edit(h.files, FEATURE_PATH, "\n## Architecture delta", "\n### REMOVED REQ-inventory.valid-paths: Reject invalid console paths\n- Reason: the catalog now rejects them\n- Migration: none needed\n\n## Architecture delta");
    edit(h.files, FEATURE_PATH, "| Change | Delivers | Builds | Depends on |\n| --- | --- | --- | --- |", "| Change | Delivers | Builds | Removes | Depends on |\n| --- | --- | --- | --- | --- |");
    edit(h.files, FEATURE_PATH, "MOD-access.adapters | |", "MOD-access.adapters | REQ-inventory.valid-paths | |");
    edit(h.files, FEATURE_PATH, "FLOW-access.hop-failure | 01-local-serial |", "FLOW-access.hop-failure | | 01-local-serial |");
    edit(h.files, FEATURE_PATH, "- D4: ", "- D5: Paths are checked as SCN-inventory.serial-not-last says\n- D4: ");
    edit(h.files, CHANGE_01_PATH, "MOD-access.adapters\n", "MOD-access.adapters\n- Removes: REQ-inventory.valid-paths\n");
    await approveDesign(h.deps);
    await buildChange(h, CHANGE_01, BRANCH_01);
    const before = new Map(h.files.files);
    await assert.rejects(landChange(h.deps, CHANGE_01), (e: unknown) => e instanceof CruzeError && e.code === "merge-invalid" && /feature\.md:\d+ SCN-inventory\.serial-not-last is cited/.test(e.message));
    assert.deepEqual(h.files.files, before);
  });

  it("won't let a feature overwrite an element someone else changed after it merged it", async () => {
    const h = await landFirstChange();
    edit(h.files, "docs/architecture.md", "any other byte releases `0x1d`", "any other byte releases `0x1d` at once");
    await approveArtifact(h.deps, "architecture");
    await assert.rejects(approveArtifact(h.deps, FEATURE), (e: unknown) => e instanceof CruzeError && e.code === "rebase-required" && /--rebase ENT-access\.escape-detector/.test(e.message));
    h.files.files.set(`.cruze/features/${FEATURE}/changes/02-ssh-hops/change.md`, CHANGE_02_TEXT);
    h.repository.branch = "open-console-ssh";
    await assert.rejects(landChange(h.deps, CHANGE_02), (e: unknown) => e instanceof CruzeError && e.code === "not-ready");
  });

  it("won't let a feature's first land overwrite a rethink of an element its delta modifies", async () => {
    const h = await exampleProject();
    await approveDesign(h.deps);
    edit(h.files, "docs/architecture.md", "links are closed in the reverse order they were opened", "links are closed in the reverse order they were opened, within one second each");
    await approveArtifact(h.deps, "architecture");
    await assert.rejects(approveArtifact(h.deps, FEATURE), (e: unknown) => e instanceof CruzeError && e.code === "rebase-required" && /ENT-access\.console-session/.test(e.message));
  });

  // my_toolkit dead-ended once work was archive-ready.
  it("rethinks the architecture after a land, with the rest of the feature showing exactly what went stale", async () => {
    const h = await landFirstChange();
    edit(h.files, "docs/architecture.md", "- Adopts: `russh`, which runs over any async stream", "- Adopts: `russh` 0.50 or later, which runs over any async stream");
    await recordEvent(h.deps, "rethink", { level: "architecture", kind: "discovery", summary: "pin russh for jump-host support", wrong: "ADP-access.ssh-connector", found_by: "build" });
    const stale = await showStatus(h.deps);
    assert.equal(stale.features[0]?.approval.state, "upstream-changed");
    assert.deepEqual(stale.features[0]?.approval.changed, ["ADP-access.ssh-connector"]);
    for (const ref of ["architecture", FEATURE]) await approveArtifact(h.deps, ref);
    assert.equal((await showStatus(h.deps)).features[0]?.approval.state, "approved");
  });
});
