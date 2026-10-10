import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { recordEvent } from "../src/app/use_cases/journal_events.ts";
import { showScope } from "../src/app/use_cases/show_scope.ts";
import { CruzeError } from "../src/domain/cruze_error.ts";
import { CHANGE_01, FEATURE, FEATURE_PATH, exampleProject } from "./support/harness.ts";

const rejectsWith = (code: string) => (error: unknown) => error instanceof CruzeError && error.code === code;

// Two projects read their 40k-word architecture whole about 150 times each, and their feature files 200 times,
// because plan and build say "read every element in the scope" and nothing cut those elements out.
describe("showing the design a change builds", () => {
  it("gives every element the change builds, from the feature's delta first and the living docs otherwise", async () => {
    const h = await exampleProject();
    const report = await showScope(h.deps, CHANGE_01);
    assert.equal(report.kind, "change");
    assert.equal(report.feature, FEATURE);
    const byId = new Map(report.elements.map((e) => [e.id, e]));
    const detector = byId.get("ENT-access.escape-detector");
    assert.equal(detector?.op, "ADDED");
    assert.match(detector?.source ?? "", new RegExp(`^${FEATURE_PATH}:\\d+$`));
    assert.match(detector?.body.join("\n") ?? "", /^### ADDED ENT-access.escape-detector: Escape detector/);
    const findDevice = byId.get("UC-inventory.find-device");
    assert.equal(findDevice?.op, undefined);
    assert.match(findDevice?.source ?? "", /^docs\/architecture\.md:\d+$/);
    assert.deepEqual(report.missing, []);
  });

  it("gives every scenario the change delivers, with the decisions and the ledger that bind it", async () => {
    const h = await exampleProject();
    await recordEvent(h.deps, "disposition", { finding: "Contracts: the hop connector names no timeout", disposition: "fixed", reason: "D2 gives 10 seconds", review: "design", decided: "agent" }, FEATURE);
    const report = await showScope(h.deps, CHANGE_01);
    assert.deepEqual(report.scenarios.map((s) => s.id), ["SCN-access.direct-serial", "SCN-access.detach", "SCN-access.escape-not-completed", "SCN-access.serial-busy", "SCN-access.unknown-device-suggestion"]);
    assert.match(report.scenarios[0]?.body.join("\n") ?? "", /GIVEN/);
    assert.ok(report.decisions.some((line) => line.startsWith("- D2: Each hop gets 10 seconds")));
    assert.deepEqual(report.dispositions.map((d) => [d.disposition, d.finding]), [["fixed", "Contracts: the hop connector names no timeout"]]);
  });

  it("names what the shown elements cite without including it, so the reader fetches only what it needs", async () => {
    const h = await exampleProject();
    const report = await showScope(h.deps, CHANGE_01);
    const shown = new Set([...report.elements, ...report.scenarios].map((e) => e.id));
    assert.ok(report.cited.length > 0);
    for (const cited of report.cited) {
      assert.ok(!shown.has(cited.id), `${cited.id} is both shown and cited`);
      assert.match(cited.source, /^docs\/.*:\d+$|^\.cruze\/.*:\d+$/);
    }
    assert.ok(report.cited.some((c) => c.id === "ENT-inventory.console-path" && /^docs\/architecture\.md:/.test(c.source)));
  });

  it("shows a feature's whole delta, and refuses anything that isn't work", async () => {
    const h = await exampleProject();
    const report = await showScope(h.deps, FEATURE);
    assert.equal(report.kind, "feature");
    assert.ok(report.elements.every((e) => e.op !== undefined));
    assert.ok(report.scenarios.some((s) => s.id === "REQ-access.hop-failure" && /#### SCN-access.serial-busy/.test(s.body.join("\n"))));
    await assert.rejects(showScope(h.deps, "architecture"), rejectsWith("not-work"));
    await assert.rejects(showScope(h.deps, "no-such-thing"), rejectsWith("not-found"));
  });
});
