import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { approveArtifact } from "../src/app/use_cases/approve_artifact.ts";
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

  // mw-configuration-service: a module's Path missed the crate entry files, and only CI's check found it at build.
  it("warns when a task writes a source file no module's Path covers", async () => {
    const h = await exampleProject();
    edit(h.files, CHANGE_01_PATH, "- T11: `main` in `src/main.rs`,", "- T11: `main` in `src/main.rs`, `src/bin/serial_probe.rs`, `tests/probe.rs`,");
    const problems = (await validate(h.deps)).problems.filter((p) => p.rule === "outside-module-map");
    assert.deepEqual(problems.map((p) => [p.path, p.severity, p.message]), [[CHANGE_01_PATH, "warning", "T11 writes src/bin/serial_probe.rs, which no module's Path covers; add it to a module's Path or move the file"]]);
  });

  // mw-configuration-service: the README had a title and sections, but never said what the project is.
  it("warns, once the vision is approved, when the README has nothing under its title", async () => {
    const h = await exampleProject();
    const readmeWarnings = async (): Promise<string[]> => (await validate(h.deps)).problems.filter((p) => p.rule === "readme-overview").map((p) => `${p.path} ${p.severity}`);
    h.files.files.set("README.md", "# Console Access\n\n![logo](logo.svg)\n\n## Architecture\n\nA hexagon.\n");
    assert.deepEqual(await readmeWarnings(), []);
    await approveArtifact(h.deps, "vision");
    assert.deepEqual(await readmeWarnings(), ["README.md warning"]);
    h.files.files.set("README.md", "# Console Access\n\n![logo](logo.svg)\n\n`consolectl` opens device consoles over serial and SSH hops.\n\n## Architecture\n");
    assert.deepEqual(await readmeWarnings(), []);
  });

  // mw-configuration-service: two features of 9 changes each; their design reviews let contradictions through to plan.
  it("warns when a feature has more changes than one design review can hold", async () => {
    const h = await exampleProject();
    const text = h.files.files.get(FEATURE_PATH) ?? "";
    const row = "| 02-ssh-hops | SCN-access.ssh-direct, SCN-access.ssh-through-jump-host, SCN-access.second-hop-refused | ADP-access.ssh-connector, FLOW-access.hop-failure | 01-local-serial |\n";
    const more = [3, 4, 5, 6, 7].map((n) => `| 0${n}-more-${n} | | | 01-local-serial |\n`).join("");
    h.files.files.set(FEATURE_PATH, text.replace(row, row + more));
    const sizes = (await validate(h.deps)).problems.filter((p) => p.rule === "feature-size");
    assert.deepEqual(sizes.map((p) => [p.path, p.severity]), [[FEATURE_PATH, "warning"]]);
    assert.match(sizes[0]?.message ?? "", /7 changes, over 6/);
  });

  it("warns when a change is too small to be worth its own review and verify", async () => {
    const h = await exampleProject();
    edit(h.files, ".cruze/config.yaml", "changes:\n  min_builds: 2\n", "");
    const small = (await validate(h.deps)).problems.filter((p) => p.rule === "change-too-small");
    assert.deepEqual(small.map((p) => [p.path, p.severity]), [[FEATURE_PATH, "warning"]]);
    assert.match(small[0]?.message ?? "", /02-ssh-hops builds 2 element\(s\), under 3/);
  });

  it("warns when a change, or its plan, is more than one review and one verifier run can hold", async () => {
    const h = await exampleProject();
    edit(h.files, ".cruze/config.yaml", "  min_builds: 2\n", "  min_builds: 2\n  max_scenarios: 4\n  max_tasks: 10\n");
    const large = (await validate(h.deps)).problems.filter((p) => p.rule.endsWith("-too-large")).sort((a, b) => a.rule.localeCompare(b.rule));
    assert.deepEqual(large.map((p) => [p.rule, p.path, p.severity]), [["change-too-large", FEATURE_PATH, "warning"], ["plan-too-large", CHANGE_01_PATH, "warning"]]);
    assert.match(large[0]?.message ?? "", /01-local-serial delivers 5 scenarios, over 4/);
    assert.match(large[1]?.message ?? "", /11 tasks, over 10/);
  });

  // rto split every context into package targets per layer; a context can keep its core as one module.
  it("accepts a core module that holds a context's domain and application together", async () => {
    const h = await exampleProject();
    edit(h.files, "docs/architecture.md", "- Layer: domain", "- Layer: core");
    const report = await validate(h.deps);
    assert.ok(!report.problems.some((p) => p.rule === "fact-value"), report.problems.map((p) => p.message).join("; "));
  });

  it("reports a review.decide or a size limit it doesn't know", async () => {
    const h = await exampleProject();
    edit(h.files, ".cruze/config.yaml", "  min_builds: 2\n", "  min_builds: none\n");
    h.files.files.set(".cruze/config.yaml", `${h.files.files.get(".cruze/config.yaml") ?? ""}review:\n  decide: sometimes\n`);
    const messages = (await validate(h.deps)).problems.filter((p) => p.rule === "config").map((p) => p.message).sort();
    assert.deepEqual(messages, ["changes.min_builds must be a positive whole number", "review.decide must be exceptions or all"]);
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
    { name: "a module Path written as a glob", path: "docs/architecture.md", from: "- Path: `src/access/adapters/`", to: "- Path: `src/access/adapters/**`", rule: "module-path-glob" },
    {
      name: "a citation of a scenario that a modified requirement drops",
      path: FEATURE_PATH,
      from: "## Spec delta\n",
      to: "## Spec delta\n\n### MODIFIED REQ-inventory.list-devices: List configured devices\nThe CLI SHALL list every configured device in name order, and say when none is configured instead of SCN-inventory.no-config's message.\n\n#### SCN-inventory.list-configured: Devices with different console paths\n- GIVEN the configuration defines `lab-router`\n- WHEN the user runs `consolectl list`\n- THEN the output has one line\n",
      rule: "cites-dropped",
    },
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
