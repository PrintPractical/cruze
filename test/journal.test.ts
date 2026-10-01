import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { exportFeedback, listEvents, recordEvent } from "../src/app/use_cases/journal_events.ts";
import { CruzeError } from "../src/domain/cruze_error.ts";
import { CHANGE_01, FEATURE, exampleProject } from "./support/harness.ts";

const rejectsWith = (code: string) => (error: unknown) => error instanceof CruzeError && error.code === code;

describe("the journal and feedback export", () => {
  it("refuses a rethink that is missing what the feedback loop needs", async () => {
    const h = await exampleProject();
    await assert.rejects(recordEvent(h.deps, "rethink", { level: "architecture", kind: "defect", summary: "x" }), rejectsWith("invalid-event"));
    await assert.rejects(recordEvent(h.deps, "rethink", { level: "galaxy", kind: "defect", summary: "x", wrong: "y", found_by: "plan" }), rejectsWith("invalid-event"));
  });

  it("exports every entry, including archived work's, with the project name and people redacted", async () => {
    const h = await exampleProject();
    await recordEvent(h.deps, "rethink", { level: "change", kind: "defect", summary: "Console Access list output was ambiguous", wrong: "SCN-inventory.list-configured", found_by: "verify", missed_by: "code-review" }, "2026-09-24-walking-skeleton");
    const bundle = await exportFeedback(h.deps, true);
    assert.equal(bundle.entries.length, 1);
    assert.equal(bundle.entries[0]?.by, "<redacted>");
    assert.equal(bundle.entries[0]?.["summary"], "<project> list output was ambiguous");
    assert.equal(bundle.entries[0]?.["item"], "2026-09-24-walking-skeleton");
  });

  // mw-configuration-service: every rethink wrote "X should have caught it; Y found it" as free text, and counts as strings.
  it("asks a defect rethink which step missed it, from the steps a retro counts", async () => {
    const h = await exampleProject();
    const rethink = { level: "feature", kind: "defect", summary: "a use case contradicted a wire rule", wrong: "UC-access.open-console", found_by: "plan-review" };
    await assert.rejects(recordEvent(h.deps, "rethink", rethink), (e: unknown) => rejectsWith("invalid-event")(e) && /rethink needs missed_by for a defect/.test((e as Error).message));
    await assert.rejects(recordEvent(h.deps, "rethink", { ...rethink, missed_by: "the reviewer" }), rejectsWith("invalid-event"));
    const entry = await recordEvent(h.deps, "rethink", { ...rethink, missed_by: "design-review" });
    assert.equal(entry["missed_by"], "design-review");
    await recordEvent(h.deps, "rethink", { ...rethink, kind: "discovery", found_by: "walkthrough" });
  });

  it("records review counts as numbers, and refuses counts that aren't", async () => {
    const h = await exampleProject();
    const entry = await recordEvent(h.deps, "review", { review: "design", round: "1", blockers: "2", concerns: "5", nits: "3" });
    assert.deepEqual([entry["round"], entry["blockers"], entry["concerns"], entry["nits"]], [1, 2, 5, 3]);
    await assert.rejects(recordEvent(h.deps, "review", { review: "design", round: "1", blockers: "two", concerns: "0" }), rejectsWith("invalid-event"));
  });

  // A project listed one change's dispositions with --item and got every disposition in the project.
  it("lists one change's entries, or a feature's with its changes'", async () => {
    const h = await exampleProject();
    const disposition = (finding: string) => ({ finding, disposition: "deferred", reason: "later", review: "code" });
    await recordEvent(h.deps, "disposition", disposition("project-wide"));
    await recordEvent(h.deps, "disposition", disposition("feature finding"), FEATURE);
    await recordEvent(h.deps, "disposition", disposition("change finding"), CHANGE_01);
    await recordEvent(h.deps, "rethink", { level: "change", kind: "discovery", summary: "s", wrong: "w", found_by: "build" }, CHANGE_01);

    const findings = async (item?: string) => (await listEvents(h.deps, "disposition", item)).map((e) => e["finding"]);
    assert.deepEqual(await findings(CHANGE_01), ["change finding"]);
    assert.deepEqual(await findings(FEATURE), ["feature finding", "change finding"]);
    assert.deepEqual(await findings(), ["project-wide", "feature finding", "change finding"]);
    await assert.rejects(listEvents(h.deps, "disposition", "no-such-item"), rejectsWith("not-found"));
  });
});
