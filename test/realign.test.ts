import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { PackageBundle } from "../src/adapters/outbound/package_bundle.ts";
import type { Bundle } from "../src/app/ports/bundle.ts";
import type { ProjectDeps } from "../src/app/project_context.ts";
import { checkCode } from "../src/app/use_cases/check_code.ts";
import { recordEvent } from "../src/app/use_cases/journal_events.ts";
import { landChange } from "../src/app/use_cases/land_change.ts";
import { showStatus, suggestNext } from "../src/app/use_cases/project_status.ts";
import { realignDone } from "../src/app/use_cases/realign_done.ts";
import { realignStatus } from "../src/app/use_cases/realign_status.ts";
import { CruzeError } from "../src/domain/cruze_error.ts";
import { BRANCH_01, CHANGE_01, approveDesign, buildChange, edit, exampleProject, type Harness } from "./support/harness.ts";

const CONFIG = ".cruze/config.yaml";
const SPLIT_TESTS = "src/access/domain/console_session/tests.rs";

/** The real bundle and its notes, as a CLI of a later release would ship them. */
async function bundleAt(version: string): Promise<Bundle> {
  const real = await PackageBundle.locate();
  return { version, skills: () => real.skills(), template: (p) => real.template(p), formatTemplate: (n) => real.formatTemplate(n) };
}

/** The example, with 0.0.2's skills installed over code that meets 0.0.1, and a Rust test file split under src/. */
async function upgradedProject(): Promise<{ h: Harness; deps: ProjectDeps }> {
  const h = await exampleProject();
  edit(h.files, CONFIG, 'cruze: "0.0.1"', 'cruze: "0.0.2"');
  h.files.files.set("src/access/domain/console_session.rs", "pub struct ConsoleSession;\n#[cfg(test)]\nmod tests;\n");
  h.files.files.set(SPLIT_TESTS, "use super::*;\n");
  return { h, deps: { ...h.deps, bundle: await bundleAt("0.0.2") } };
}

const rejectsWith = (code: string, message?: RegExp) => (e: unknown) => e instanceof CruzeError && e.code === code && (message === undefined || message.test(e.message));

describe("realigning a project to a new Cruze", () => {
  it("lists the notes since the code's standards, with what their CLI rules find and what the auditor must answer", async () => {
    const { deps } = await upgradedProject();
    const status = await realignStatus(deps, { full: false });
    assert.deepEqual([status.standards, status.target], ["0.0.1", "0.0.2"]);
    const placement = status.notes.find((n) => n.id === "test-placement");
    assert.deepEqual(placement?.findings.map((f) => f.path), [SPLIT_TESTS]);
    assert.ok(status.notes.some((n) => n.id === "error-types" && n.ask !== undefined && n.findings.length === 0));
    assert.ok(status.newWorkOnly.includes("design-review-rubric"));
    assert.equal(status.open, 1);
  });

  it("finds nothing once the code meets the installed version, unless asked for a full audit", async () => {
    const { h, deps } = await upgradedProject();
    edit(h.files, CONFIG, 'standards: "0.0.1"', 'standards: "0.0.2"');
    assert.deepEqual((await realignStatus(deps, { full: false })).notes, []);
    assert.ok((await realignStatus(deps, { full: true })).notes.some((n) => n.id === "test-placement"));
  });

  it("asks for cruze install first when the skills are older than the CLI", async () => {
    const h = await exampleProject();
    await assert.rejects(realignStatus({ ...h.deps, bundle: await bundleAt("0.0.2") }, { full: false }), rejectsWith("install-first", /skills are from Cruze 0\.0\.1, and this CLI is 0\.0\.2/));
  });

  it("won't move the standards while a finding is open, and names it", async () => {
    const { h, deps } = await upgradedProject();
    const before = h.files.files.get(CONFIG);
    await assert.rejects(realignDone(deps, {}), rejectsWith("realign-open", /test-placement: src\/access\/domain\/console_session\/tests\.rs/));
    assert.equal(h.files.files.get(CONFIG), before);
  });

  it("schedules open check findings in a change: excepted until it lands, so CI stays green, with the config's comments kept", async () => {
    const { h, deps } = await upgradedProject();
    const report = await realignDone(deps, { change: CHANGE_01 });
    assert.deepEqual(report, { from: "0.0.1", to: "0.0.2", scheduled: CHANGE_01, excepted: [SPLIT_TESTS] });
    const config = h.files.files.get(CONFIG) ?? "";
    assert.match(config, /standards: "0\.0\.2"/);
    assert.match(config, new RegExp(`- path: ${SPLIT_TESTS}\\n\\s+reason: "?realign 0\\.0\\.2 \\(test-placement\\): scheduled in ${CHANGE_01}`));
    assert.match(config, /^# Cruze project configuration/);
    assert.match(config, /^source: \["src\/\*\*\/\*\.rs"\]$/m);
    assert.equal((await checkCode(deps, { ci: true })).findings.some((f) => f.rule === "test-placement"), false);
    assert.equal(h.files.files.get(".cruze/journal.jsonl")?.includes('"event":"realign"'), true);
    assert.equal((await realignStatus(deps, { full: false })).notes.length, 0);
  });

  it("leaves every approval current: the config it writes is in no design hash", async () => {
    const { h, deps } = await upgradedProject();
    await approveDesign(h.deps);
    const before = (await showStatus(h.deps)).documents.map((d) => d.state);
    await realignDone(deps, { change: CHANGE_01 });
    const after = await showStatus(h.deps);
    assert.deepEqual(after.documents.map((d) => d.state), before);
    assert.equal(after.features[0]?.approval.state, "approved");
  });

  it("removes the scheduled exceptions when that change lands, so CI checks the files again", async () => {
    const { h, deps } = await upgradedProject();
    await realignDone(deps, { change: CHANGE_01 });
    await approveDesign(h.deps);
    await buildChange(h, CHANGE_01, BRANCH_01);
    const landed = await landChange(h.deps, CHANGE_01);
    assert.deepEqual(landed.unexcepted, [SPLIT_TESTS]);
    assert.doesNotMatch(h.files.files.get(CONFIG) ?? "", /scheduled in/);
    assert.equal((await checkCode(deps, { ci: true })).passed, false, "the split test file fails CI again until it moves");
  });

  it("never raises a validate finding the project waived, and needs no change once only waivers remain", async () => {
    const { h, deps } = await upgradedProject();
    h.files.files.delete(SPLIT_TESTS);
    h.files.files.set("README.md", "# Console Access\n\n## Architecture\n");
    h.files.files.set(".cruze/approvals.json", JSON.stringify({ version: 1, approvals: [{ artifact: "docs/vision.md", hash: "sha256:0", upstream: {}, approvedAt: "2026-09-24T00:00:00Z", by: "a" }], merged: {} }));
    const readme = (await realignStatus(deps, { full: false })).notes.find((n) => n.id === "readme-overview");
    assert.deepEqual(readme?.findings.map((f) => [f.path, f.waived]), [["README.md", false]]);
    await recordEvent(h.deps, "disposition", { finding: "readme-overview: README.md", disposition: "waived", reason: "the README is generated from the docs site", review: "realign" });
    assert.equal((await realignStatus(deps, { full: false })).open, 0);
    assert.deepEqual(await realignDone(deps, {}), { from: "0.0.1", to: "0.0.2", excepted: [] });
  });

  it("suggests realign when the code's standards are behind the installed skills", async () => {
    const { h } = await upgradedProject();
    await approveDesign(h.deps);
    const next = await suggestNext(h.deps);
    assert.ok([next.next, ...next.also].some((s) => s.step === "realign" && s.target === "0.0.2"));
  });
});
