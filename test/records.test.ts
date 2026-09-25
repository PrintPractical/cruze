import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { exportFeedback, listEvents, recordEvent } from "../src/app/use_cases/journal_events.ts";
import { createNote, createProjectDoc } from "../src/app/use_cases/new_project_doc.ts";
import { createWorkItem } from "../src/app/use_cases/new_work_item.ts";
import { approveArtifact } from "../src/app/use_cases/approve_artifact.ts";
import { addFutureFeature, completeTask, dropFutureFeature, pruneRoadmap, recordDeviation } from "../src/app/use_cases/record_progress.ts";
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

  it("creates the project's living documents from their templates, named for the project, and never overwrites one", async () => {
    const h = await exampleProject();
    h.files.files.delete("docs/glossary.md");
    const report = await createProjectDoc(h.deps, "glossary");
    assert.equal(report.path, "docs/glossary.md");
    assert.match(h.files.files.get("docs/glossary.md") ?? "", /^# Glossary\n\nThe shared language of Console Access\./);
    await assert.rejects(createProjectDoc(h.deps, "vision"), rejectsWith("exists"));
  });

  it("dates a note and never overwrites an earlier one with the same slug", async () => {
    const h = await exampleProject();
    const first = await createNote(h.deps, "ssh-libraries", "SSH libraries");
    const second = await createNote(h.deps, "ssh-libraries", "SSH libraries, again");
    assert.deepEqual([first.path, second.path], [".cruze/notes/2026-09-26-ssh-libraries.md", ".cruze/notes/2026-09-26-ssh-libraries-2.md"]);
    assert.match(h.files.files.get(second.path) ?? "", /^# SSH libraries, again\n/);
  });

  it("treats a designed standalone change as not planned yet: a warning, and no approval until plan fills it", async () => {
    const h = await exampleProject();
    for (const ref of ["vision", "architecture", "roadmap"]) await approveArtifact(h.deps, ref);
    const report = await createWorkItem(h.deps, { kind: "change", slug: "list-json", title: "List as JSON" });
    h.files.files.set(report.path, `---
id: ${report.ref}
title: List as JSON
---

# Change: List as JSON

## Intent

Let scripts read the device list.

## Adopt or build

| Component | Decision | Choice | Reason |
| --- | --- | --- | --- |

## Spec delta

### ADDED REQ-inventory.list-json: List devices as JSON
The CLI SHALL print the device list as a JSON array when the user passes \`--json\`.

#### SCN-inventory.list-json: Devices as a JSON array
- GIVEN the configuration defines \`lab-router\`
- WHEN the user runs \`consolectl list --json\`
- THEN the output is a JSON array with one object whose \`name\` is \`lab-router\`

## Architecture delta

None.

## Scope

- Delivers: SCN-inventory.list-json
- Builds:

## Test plan

| Subject | Seam | Test file | Kind |
| --- | --- | --- | --- |

## Tasks

## Settled decisions

<!-- cruze:managed -->
## Progress
<!-- /cruze:managed -->
`);
    const problems = (await validate(h.deps)).problems.filter((p) => p.path === report.path);
    assert.deepEqual(problems.map((p) => [p.severity, p.rule]), [["warning", "not-planned"]]);
    await assert.rejects(approveArtifact(h.deps, report.ref), rejectsWith("not-planned"));
  });

  it("treats a feature with no changes yet as not designed: a warning, and no approval until architect splits it", async () => {
    const h = await exampleProject();
    for (const ref of ["vision", "architecture", "roadmap"]) await approveArtifact(h.deps, ref);
    const report = await createWorkItem(h.deps, { kind: "feature", slug: "list-json", title: "List as JSON" });
    h.files.files.set(report.path, `---
id: ${report.ref}
title: List as JSON
---

# Feature: List as JSON

## Intent

Let scripts read the device list.

## Settled decisions

## Adopt or build

| Component | Decision | Choice | Reason |
| --- | --- | --- | --- |

## Spec delta

### ADDED REQ-inventory.list-json: List devices as JSON
The CLI SHALL print the device list as a JSON array when the user passes \`--json\`.

#### SCN-inventory.list-json: Devices as a JSON array
- GIVEN the configuration defines \`lab-router\`
- WHEN the user runs \`consolectl list --json\`
- THEN the output is a JSON array with one object whose \`name\` is \`lab-router\`

## Architecture delta

None.

## Changes

| Change | Delivers | Builds | Depends on |
| --- | --- | --- | --- |

<!-- cruze:managed -->
## Progress
<!-- /cruze:managed -->
`);
    const problems = (await validate(h.deps)).problems.filter((p) => p.path === report.path);
    assert.deepEqual(problems.map((p) => [p.severity, p.rule]), [["warning", "not-designed"]]);
    await assert.rejects(approveArtifact(h.deps, report.ref), rejectsWith("not-designed"));
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

  it("keeps a deviation that quotes angle brackets from reading as a template leftover", async () => {
    const h = await exampleProject();
    await recordDeviation(h.deps, "T2", "a bare consolectl now prints 'consolectl: missing <COMMAND>'", { change: CHANGE_01 });
    assert.deepEqual((await validate(h.deps)).problems.filter((p) => p.rule === "template-leftover"), []);
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

describe("naming and closing work", () => {
  it("finds an active item by its slug, without the date or change number", async () => {
    const h = await exampleProject();
    h.repository.branch = BRANCH_01;
    const report = await completeTask(h.deps, "T1", { change: "open-console/local-serial" });
    assert.equal(report.change, CHANGE_01);
  });

  it("clears landed items from the roadmap status when a release closes, and keeps the rest", async () => {
    const h = await exampleProject();
    assert.deepEqual(await pruneRoadmap(h.deps), { removed: ["walking-skeleton"] });
    const roadmap = h.files.files.get("docs/roadmap.md") ?? "";
    assert.doesNotMatch(roadmap, /\| walking-skeleton \| 2026-09-24-walking-skeleton \| landed \|/);
    assert.match(roadmap, /\| open-console \| 2026-09-25-open-console \| building \|/);
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
