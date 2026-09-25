import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { validate } from "../src/app/use_cases/validate_project.ts";
import { CHANGE_01_PATH, FEATURE_PATH, edit, exampleProject } from "./support/harness.ts";

describe("validating a project", () => {
  it("accepts the worked example with no problems", async () => {
    const { deps } = await exampleProject();
    const report = await validate(deps);
    assert.deepEqual(report.problems, []);
    assert.equal(report.valid, true);
  });

  it("expects no statuses in an architecture that has never been approved, and asks for them once it has", async () => {
    const h = await exampleProject();
    const unstamped = (h.files.files.get("docs/architecture.md") ?? "").replace(/^- Status: (planned|built)\n/gm, "");
    h.files.files.set("docs/architecture.md", unstamped);
    assert.deepEqual((await validate(h.deps)).problems.filter((p) => p.rule === "missing-status"), []);
    h.files.files.set(".cruze/approvals.json", JSON.stringify({ version: 1, approvals: [{ artifact: "docs/architecture.md", hash: "sha256:0", upstream: {}, approvedAt: "2026-09-24T00:00:00Z", by: "a" }], merged: {} }));
    assert.ok((await validate(h.deps)).problems.some((p) => p.rule === "missing-status"));
  });

  // Each case breaks one rule of the cruze-formats skill and names the rule that must catch it.
  const cases: Array<{ name: string; path: string; from: string; to: string; rule: string }> = [
    { name: "a cited ID that no document defines", path: "docs/architecture.md", from: "- Uses: PORT-inventory.device-catalog\n", to: "- Uses: PORT-inventory.device-katalog\n", rule: "unknown-id" },
    { name: "a fact value outside its allowed set", path: "docs/architecture.md", from: "- Direction: driven", to: "- Direction: sideways", rule: "fact-value" },
    { name: "a required fact left out", path: "docs/architecture.md", from: "- Input: a device name\n- Output: the device, with its console path", to: "- Output: the device, with its console path", rule: "required-fact" },
    { name: "an element under the wrong section", path: "docs/architecture.md", from: "## Ports\n", to: "## Portz\n", rule: "misplaced-element" },
    { name: "a requirement without SHALL or MUST", path: "docs/specs/inventory.md", from: "The CLI SHALL list every", to: "The CLI lists every", rule: "req-keyword" },
    { name: "a scenario with no WHEN step", path: "docs/specs/inventory.md", from: "- WHEN the user runs `consolectl list`\n- THEN the output has two lines", to: "- THEN the output has two lines", rule: "scenario-steps" },
    { name: "a delta scenario no change covers", path: FEATURE_PATH, from: "| SCN-access.ssh-direct, SCN-access.ssh-through-jump-host, SCN-access.second-hop-refused |", to: "| SCN-access.ssh-direct, SCN-access.second-hop-refused |", rule: "uncovered" },
    { name: "a delta element in two changes' scope", path: FEATURE_PATH, from: "| ADP-access.ssh-connector, FLOW-access.hop-failure |", to: "| ADP-access.ssh-connector, FLOW-access.hop-failure, ENT-access.escape-detector |", rule: "covered-twice" },
    { name: "an ADDED element that already exists", path: FEATURE_PATH, from: "### ADDED ENT-access.escape-detector:", to: "### ADDED ENT-inventory.device:", rule: "delta-op" },
    { name: "a scope element no task proves", path: CHANGE_01_PATH, from: "- T8: `SerialConnector` in `src/access/adapters/serial_connector.rs`, proves ADP-access.serial-connector\n", to: "", rule: "unproved-scope" },
    { name: "a malformed task line", path: CHANGE_01_PATH, from: "- T1: `EscapeDetector` in", to: "- T1: EscapeDetector in", rule: "task-format" },
    { name: "a delivered scenario without a behaviour test", path: CHANGE_01_PATH, from: "| `tests/access_open_console.rs` | behaviour |\n| SCN-access.escape-not-completed", to: "| `tests/access_open_console.rs` | smoke |\n| SCN-access.escape-not-completed", rule: "missing-behaviour-test" },
    { name: "a built adapter whose port has no contract test", path: CHANGE_01_PATH, from: "| `tests/contract_terminal.rs` | contract |", to: "| `tests/contract_terminal.rs` | smoke |", rule: "missing-contract-test" },
    { name: "a change scope that disagrees with the feature", path: CHANGE_01_PATH, from: "- Delivers: SCN-access.direct-serial, ", to: "- Delivers: ", rule: "scope-mismatch" },
    { name: "a leftover template guide", path: "docs/vision.md", from: "## Non-goals\n", to: "## Non-goals\n\n- <What the product deliberately doesn't do.>\n", rule: "template-leftover" },
    { name: "a roadmap blocking cycle", path: "docs/roadmap.md", from: "| walking-skeleton | change | GOAL-paths-in-config | |", to: "| walking-skeleton | change | GOAL-paths-in-config | open-console |", rule: "roadmap-cycle" },
    { name: "a frontmatter ID that isn't the folder name", path: FEATURE_PATH, from: "id: 2026-09-25-open-console", to: "id: open-console", rule: "frontmatter" },
    { name: "an invalid config value", path: ".cruze/config.yaml", from: "max_lines: 250", to: "max_lines: -1", rule: "config" },
  ];
  for (const c of cases) {
    it(`reports ${c.name} as ${c.rule}`, async () => {
      const { files, deps } = await exampleProject();
      edit(files, c.path, c.from, c.to);
      const report = await validate(deps);
      assert.equal(report.valid, false);
      assert.ok(
        report.problems.some((p) => p.rule === c.rule && p.severity === "error"),
        `expected a ${c.rule} error, got: ${report.problems.map((p) => p.rule).join(", ")}`,
      );
    });
  }
});
