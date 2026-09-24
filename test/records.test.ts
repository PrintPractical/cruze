import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { exportFeedback, listEvents, recordEvent } from "../src/app/use_cases/journal_events.ts";
import { createWorkItem } from "../src/app/use_cases/new_work_item.ts";
import { addFutureFeature, completeTask, dropFutureFeature, recordDeviation } from "../src/app/use_cases/record_progress.ts";
import { validate } from "../src/app/use_cases/validate_project.ts";
import { CruzeError } from "../src/domain/cruze_error.ts";
import { BRANCH_01, CHANGE_01, CHANGE_01_PATH, FEATURE, exampleProject } from "./support/harness.ts";

const rejectsWith = (code: string) => (error: unknown) => error instanceof CruzeError && error.code === code;

describe("creating work", () => {
  it("gives a new feature a dated ID, its template and a roadmap status of designing", async () => {
    const h = await exampleProject();
    const report = await createWorkItem(h.deps, { kind: "feature", slug: "remote-serial", title: "Serial behind a jump host" });
    assert.equal(report.ref, "2026-09-26-remote-serial");
    const text = h.files.files.get(report.path) ?? "";
    assert.match(text, /^---\nid: 2026-09-26-remote-serial\ntitle: Serial behind a jump host\nroadmap: remote-serial\n---/);
    assert.match(h.files.files.get("docs/roadmap.md") ?? "", /\| remote-serial \| 2026-09-26-remote-serial \| designing \|/);
  });

  it("never reuses an ID: a same-day clash gets a suffix", async () => {
    const h = await exampleProject();
    const first = await createWorkItem(h.deps, { kind: "feature", slug: "run-commands", title: "Run commands" });
    const second = await createWorkItem(h.deps, { kind: "feature", slug: "run-commands", title: "Run commands, again" });
    assert.equal(first.ref, "2026-09-26-run-commands");
    assert.equal(second.ref, "2026-09-26-run-commands-2");
  });

  it("creates a feature's change from its Changes row, with the scope filled in", async () => {
    const h = await exampleProject();
    const report = await createWorkItem(h.deps, { kind: "change", slug: "ssh-hops", title: "Consoles over SSH hops", feature: FEATURE });
    assert.equal(report.ref, `${FEATURE}/02-ssh-hops`);
    const text = h.files.files.get(report.path) ?? "";
    assert.match(text, /- Delivers: SCN-access\.ssh-direct, SCN-access\.ssh-through-jump-host, SCN-access\.second-hop-refused\n- Builds: ADP-access\.ssh-connector, FLOW-access\.hop-failure/);
  });

  it("refuses a change that isn't in the feature's Changes table", async () => {
    const h = await exampleProject();
    await assert.rejects(createWorkItem(h.deps, { kind: "change", slug: "telnet", title: "Telnet", feature: FEATURE }), rejectsWith("change-not-listed"));
  });

  it("leaves template guides for the author, which validation flags until they are filled", async () => {
    const h = await exampleProject();
    await createWorkItem(h.deps, { kind: "adr", slug: "tokio-runtime", title: "One single-threaded Tokio runtime" });
    const report = await validate(h.deps);
    assert.ok(report.problems.some((p) => p.path === "docs/adr/2026-09-26-tokio-runtime.md" && p.rule === "template-leftover"));
  });
});

describe("recording progress", () => {
  it("ticks tasks with their commit on the change bound to this branch", async () => {
    const h = await exampleProject();
    h.repository.branch = BRANCH_01;
    h.repository.commit = "f00dbab";
    const report = await completeTask(h.deps, "T3", {});
    assert.deepEqual(report, { change: CHANGE_01, task: "T3", done: 1, total: 11 });
    assert.match(h.files.files.get(CHANGE_01_PATH) ?? "", /- \[x\] T3 \(f00dbab\)/);
  });

  it("records a deviation in the progress block and the journal", async () => {
    const h = await exampleProject();
    await recordDeviation(h.deps, "T2", "kept close order in a helper inside console_session.rs", { change: CHANGE_01 });
    assert.match(h.files.files.get(CHANGE_01_PATH) ?? "", /- Deviation T2: kept close order/);
    assert.equal((await listEvents(h.deps, "deviation")).length, 1);
  });

  it("refuses a task the change doesn't have", async () => {
    const h = await exampleProject();
    await assert.rejects(completeTask(h.deps, "T99", { change: CHANGE_01 }), rejectsWith("unknown-task"));
  });

  it("adds and drops future features on the feature map", async () => {
    const h = await exampleProject();
    await addFutureFeature(h.deps, "telnet", "Consoles over telnet", ["GOAL-one-command"]);
    assert.match(h.files.files.get("docs/vision.md") ?? "", /\| telnet \| Consoles over telnet \| GOAL-one-command \|/);
    await dropFutureFeature(h.deps, "telnet", "every lab device supports SSH");
    assert.doesNotMatch(h.files.files.get("docs/vision.md") ?? "", /telnet/);
    assert.deepEqual((await validate(h.deps)).problems, []);
  });
});

describe("the journal and feedback export", () => {
  it("refuses a rethink that is missing what the feedback loop needs", async () => {
    const h = await exampleProject();
    await assert.rejects(recordEvent(h.deps, "rethink", { level: "architecture", kind: "defect", summary: "x" }), rejectsWith("invalid-event"));
    await assert.rejects(recordEvent(h.deps, "rethink", { level: "galaxy", kind: "defect", summary: "x", wrong: "y", caught_by: "plan" }), rejectsWith("invalid-event"));
  });

  it("exports every entry, including archived work's, with the project name and people redacted", async () => {
    const h = await exampleProject();
    await recordEvent(h.deps, "rethink", { level: "change", kind: "defect", summary: "Console Access list output was ambiguous", wrong: "SCN-inventory.list-configured", caught_by: "verify" }, "2026-09-24-walking-skeleton");
    const bundle = await exportFeedback(h.deps, true);
    assert.equal(bundle.entries.length, 1);
    assert.equal(bundle.entries[0]?.by, "<redacted>");
    assert.equal(bundle.entries[0]?.["summary"], "<project> list output was ambiguous");
    assert.equal(bundle.entries[0]?.["item"], "2026-09-24-walking-skeleton");
  });
});
