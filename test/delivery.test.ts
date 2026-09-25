import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { abandonWork } from "../src/app/use_cases/abandon_work.ts";
import { approveArtifact } from "../src/app/use_cases/approve_artifact.ts";
import { listEvents, recordEvent } from "../src/app/use_cases/journal_events.ts";
import { landChange } from "../src/app/use_cases/land_change.ts";
import { suggestNext } from "../src/app/use_cases/project_status.ts";
import { completeTask, reopenTask } from "../src/app/use_cases/record_progress.ts";
import { validate } from "../src/app/use_cases/validate_project.ts";
import { CruzeError } from "../src/domain/cruze_error.ts";
import { renderTemplate } from "../src/domain/scaffold.ts";
import { BRANCH_01, CHANGE_01, CHANGE_01_PATH, CHANGE_02, CHANGE_02_TEXT, FEATURE, approveDesign, buildChange, edit, exampleProject, type Harness } from "./support/harness.ts";

const rejectsWith = (code: string) => (error: unknown) => error instanceof CruzeError && error.code === code;
const next = async (h: Harness) => (await suggestNext(h.deps)).next;

/** Approves the change on its branch and ticks every task, without verifying it. */
async function buildWithoutVerifying(h: Harness): Promise<void> {
  h.repository.branch = BRANCH_01;
  await approveArtifact(h.deps, CHANGE_01);
  for (const task of (h.files.files.get(CHANGE_01_PATH) ?? "").matchAll(/^- (T\d+): /gm)) await completeTask(h.deps, task[1] ?? "", {});
}

describe("the next step", () => {
  it("follows a change from its plan to its land, then moves to the feature's next change", async () => {
    const h = await exampleProject();
    assert.deepEqual(await next(h), { step: "envision", reason: "finish the vision and approve it" });
    await approveDesign(h.deps);
    h.repository.branch = "main";
    assert.equal((await next(h)).step, "plan");

    h.repository.branch = BRANCH_01;
    await approveArtifact(h.deps, CHANGE_01);
    assert.deepEqual(await next(h), { step: "build", target: CHANGE_01, reason: "the change has open tasks" });
    for (const task of (h.files.files.get(CHANGE_01_PATH) ?? "").matchAll(/^- (T\d+): /gm)) await completeTask(h.deps, task[1] ?? "", {});
    assert.equal((await next(h)).step, "verify");
    await recordEvent(h.deps, "verification", { result: "accepted", summary: "all five scenarios ran on a pseudo-terminal" }, CHANGE_01);
    assert.equal((await next(h)).step, "land");

    await landChange(h.deps, CHANGE_01);
    assert.deepEqual(await next(h), { step: "plan", target: `${FEATURE}/02-ssh-hops`, reason: "the next change of an approved feature, with its dependencies landed" });
  });

  it("sends a change whose feature changed after approval to rethink, naming what changed", async () => {
    const h = await exampleProject();
    await approveDesign(h.deps);
    await buildWithoutVerifying(h);
    const architecture = h.files.files.get("docs/architecture.md") ?? "";
    h.files.files.set("docs/architecture.md", architecture.replace("links are closed in the reverse order they were opened", "links are closed in any order"));
    const step = await next(h);
    assert.equal(step.step, "rethink");
    assert.equal(step.target, "architecture");
  });

  it("sends a build to rethink once an architecture rethink leaves its feature stale, even though the gate's documents look approved", async () => {
    const h = await exampleProject();
    await approveDesign(h.deps);
    await buildWithoutVerifying(h);
    edit(h.files, "docs/architecture.md", "links are closed in the reverse order they were opened", "links are closed in the reverse order they were opened, within one second each");
    await approveArtifact(h.deps, "architecture");
    const step = await next(h);
    assert.equal(step.step, "rethink");
    assert.equal(step.target, FEATURE);
  });

  it("points to the change's own branch when another branch is checked out", async () => {
    const h = await exampleProject();
    await approveDesign(h.deps);
    await buildWithoutVerifying(h);
    h.repository.branch = "main";
    assert.deepEqual(await next(h), { step: "switch-branch", target: BRANCH_01, reason: `${CHANGE_01} is built on branch ${BRANCH_01}` });
  });
});

describe("the verification gate on land", () => {
  it("refuses a change nobody verified, and journals an override when the user gives one", async () => {
    const h = await exampleProject();
    await approveDesign(h.deps);
    await buildWithoutVerifying(h);
    await assert.rejects(landChange(h.deps, CHANGE_01), rejectsWith("not-verified"));
    await landChange(h.deps, CHANGE_01, { override: "verified by hand on the lab router" });
    assert.deepEqual((await listEvents(h.deps, "override")).map((e) => [e["gate"], e["reason"]]), [["land", "verified by hand on the lab router"]]);
  });

  it("asks for verification again when the plan changes after it, but not when only the approval is renewed", async () => {
    const h = await exampleProject();
    await approveDesign(h.deps);
    await buildWithoutVerifying(h);
    await recordEvent(h.deps, "verification", { result: "accepted", summary: "ok" }, CHANGE_01);
    await approveArtifact(h.deps, CHANGE_01);
    assert.equal((await next(h)).step, "land");
    edit(h.files, CHANGE_01_PATH, "## Risks\n", "## Risks\n\n- The serial device may be held by another program.\n");
    await approveArtifact(h.deps, CHANGE_01);
    await assert.rejects(landChange(h.deps, CHANGE_01), rejectsWith("not-verified"));
  });

  it("refuses when the latest verification sent the change back", async () => {
    const h = await exampleProject();
    await approveDesign(h.deps);
    await buildWithoutVerifying(h);
    await recordEvent(h.deps, "verification", { result: "accepted", summary: "ok" }, CHANGE_01);
    await recordEvent(h.deps, "verification", { result: "sent-back", summary: "detach leaves the terminal in raw mode" }, CHANGE_01);
    await assert.rejects(landChange(h.deps, CHANGE_01), rejectsWith("not-verified"));
  });
});

describe("keeping AGENTS.md current", () => {
  it("fills its commands and layout on land from the config and the built modules, leaving the rest alone", async () => {
    const h = await exampleProject();
    const template = readFileSync(new URL("../templates/init/AGENTS.md", import.meta.url), "utf8");
    h.files.files.set("AGENTS.md", `${renderTemplate(template, { project_name: "Console Access" })}\nA line of my own.\n`);
    h.files.files.set(".cruze/config.yaml", `${h.files.files.get(".cruze/config.yaml") ?? ""}\ncommands:\n  test: cargo test\n  run: cargo run -- list\n`);
    await approveDesign(h.deps);
    await buildChange(h, CHANGE_01, BRANCH_01);
    await landChange(h.deps, CHANGE_01);
    const agents = h.files.files.get("AGENTS.md") ?? "";
    assert.match(agents, /## Commands\n\n<!-- cruze:managed -->\n- test: `cargo test`\n- run: `cargo run -- list`\n<!-- \/cruze:managed -->/);
    assert.match(agents, /- `src\/access\/domain\/` \(domain\): Access domain/);
    assert.match(agents, /A line of my own\.\n$/);
  });
});

describe("rethinking and stopping work", () => {
  it("sets a built element back to planned when a rethink changes its design, so a change can build it again", async () => {
    const h = await exampleProject();
    await approveDesign(h.deps);
    await buildChange(h, CHANGE_01, BRANCH_01);
    await landChange(h.deps, CHANGE_01);
    edit(h.files, "docs/architecture.md", "any other byte releases `0x1d`", "any other byte releases `0x1d` at once");
    const report = await approveArtifact(h.deps, "architecture", { replan: ["ENT-access.escape-detector"] });
    assert.deepEqual(report.replanned, ["ENT-access.escape-detector"]);
    assert.match(h.files.files.get("docs/architecture.md") ?? "", /### ENT-access\.escape-detector: [^\n]*\n(- .*\n|  .*\n)*- Status: planned/);
    await assert.rejects(approveArtifact(h.deps, "architecture", { replan: ["ENT-access.escape-detector"] }), rejectsWith("not-built"));
  });

  it("lets a later change rebuild an element a landed change built, without counting it twice", async () => {
    const h = await exampleProject();
    await approveDesign(h.deps);
    await buildChange(h, CHANGE_01, BRANCH_01);
    await landChange(h.deps, CHANGE_01);
    edit(h.files, "docs/architecture.md", "any other byte releases `0x1d`", "any other byte releases `0x1d` at once");
    await approveArtifact(h.deps, "architecture", { replan: ["ENT-access.escape-detector"] });
    edit(h.files, `.cruze/features/${FEATURE}/feature.md`, "| ADP-access.ssh-connector, FLOW-access.hop-failure | 01-local-serial |", "| ADP-access.ssh-connector, FLOW-access.hop-failure, ENT-access.escape-detector | 01-local-serial |");
    const problems = (await validate(h.deps)).problems.filter((p) => p.message.includes("ENT-access.escape-detector"));
    assert.deepEqual(problems.map((p) => p.rule), []);
  });

  it("lands after a conflict once the feature accepts the living text it now builds on", async () => {
    const h = await exampleProject();
    await approveDesign(h.deps);
    await buildChange(h, CHANGE_01, BRANCH_01);
    await landChange(h.deps, CHANGE_01);
    edit(h.files, "docs/architecture.md", "any other byte releases `0x1d`", "any other byte releases `0x1d` at once");
    await approveArtifact(h.deps, "architecture");
    edit(h.files, `.cruze/features/${FEATURE}/feature.md`, "any other byte releases `0x1d`", "any other byte releases `0x1d` at once");
    await approveArtifact(h.deps, FEATURE, { rebase: ["ENT-access.escape-detector"] });
    h.files.files.set(`.cruze/features/${FEATURE}/changes/02-ssh-hops/change.md`, CHANGE_02_TEXT);
    await buildChange(h, CHANGE_02, "open-console-ssh");
    const report = await landChange(h.deps, CHANGE_02);
    assert.equal(report.finished, true);
    assert.deepEqual((await validate(h.deps)).problems.filter((p) => p.severity === "error"), []);
  });

  it("reopens a done task with its reason, so build does it again", async () => {
    const h = await exampleProject();
    await approveDesign(h.deps);
    await buildWithoutVerifying(h);
    await reopenTask(h.deps, "T4", "the hop connector gained a close operation", {});
    assert.match(h.files.files.get(CHANGE_01_PATH) ?? "", /- \[ \] T4\n/);
    assert.equal((await next(h)).step, "build");
  });

  it("archives an abandoned feature with its reason, marks it on the roadmap and puts it back on the future list", async () => {
    const h = await exampleProject();
    const report = await abandonWork(h.deps, "open-console", "serial access moves to a separate tool");
    assert.deepEqual(report, { ref: FEATURE, archivedTo: `.cruze/archive/${FEATURE}`, futureList: "open-console" });
    assert.ok(h.files.files.has(`.cruze/archive/${FEATURE}/feature.md`));
    assert.match(h.files.files.get("docs/roadmap.md") ?? "", /\| open-console \| 2026-09-25-open-console \| abandoned \|/);
    assert.match(h.files.files.get("docs/vision.md") ?? "", /### Future\n\n\| Feature \| Summary \| Goals \|\n\| --- \| --- \| --- \|\n(\|.*\n)*\| open-console \| /);
    assert.deepEqual((await validate(h.deps)).problems.filter((p) => p.severity === "error"), []);
  });
});
