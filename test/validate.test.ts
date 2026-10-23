import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createDocument } from "../src/app/use_cases/new_document.ts";
import { validate } from "../src/app/use_cases/validate_project.ts";
import { CruzeError } from "../src/domain/cruze_error.ts";
import { OPEN_SERIAL, VISION, edit, exampleProject, setVersion } from "./support/harness.ts";

const rules = async (deps: Parameters<typeof validate>[0]) => (await validate(deps)).problems.map((p) => [p.path, p.rule]);

describe("validating the documents", () => {
  it("finds no problems in the worked example", async () => {
    const h = await exampleProject();
    setVersion(h.files, h.deps.bundle.version);
    assert.deepEqual((await validate(h.deps)).problems, []);
  });

  it("reports missing sections, a missing status, and a scenario that names another feature", async () => {
    const h = await exampleProject();
    setVersion(h.files, h.deps.bundle.version);
    edit(h.files, OPEN_SERIAL, "## Stack sketch", "## Sketch");
    edit(h.files, OPEN_SERIAL, "- Status: shaped\n", "");
    edit(h.files, OPEN_SERIAL, "SCN-open-serial.detach:", "SCN-serial.detach:");
    assert.deepEqual(await rules(h.deps), [[OPEN_SERIAL, "missing-section"], [OPEN_SERIAL, "status"], [OPEN_SERIAL, "scenario-id"]]);
  });

  it("reports a scenario defined twice, and a heading that isn't a proper scenario", async () => {
    const h = await exampleProject();
    setVersion(h.files, h.deps.bundle.version);
    edit(h.files, OPEN_SERIAL, "### SCN-open-serial.detach: Detach with Ctrl-]", "### SCN-open-serial.attach: Detach with Ctrl-]");
    edit(h.files, OPEN_SERIAL, "### SCN-open-serial.port-busy: Port in use", "### SCN-open-serial.port-busy Port in use");
    const problems = (await validate(h.deps)).problems;
    assert.deepEqual(problems.map((p) => p.rule), ["duplicate-scenario", "scenario-heading"]);
  });

  it("reports unknown needs and a circle of needs in the release", async () => {
    const h = await exampleProject();
    setVersion(h.files, h.deps.bundle.version);
    edit(h.files, VISION, "| list-devices | List the configured devices and how each is reached | |", "| list-devices | List the configured devices and how each is reached | run-commands, teleport |");
    const problems = (await validate(h.deps)).problems;
    assert.deepEqual(problems.map((p) => p.message), ["list-devices needs teleport, which isn't a feature of this release", "features need each other in a circle: list-devices → run-commands → open-serial → list-devices"]);
  });

  it("warns about a feature in progress the Release table doesn't list, and not about a built one", async () => {
    const h = await exampleProject();
    setVersion(h.files, h.deps.bundle.version);
    h.files.files.set("docs/features/export-logs.md", (h.files.files.get(OPEN_SERIAL) ?? "").replaceAll("open-serial", "export-logs"));
    h.files.files.set("docs/features/old-menu.md", "# Old menu\n\n- Status: built\n");
    const problems = (await validate(h.deps)).problems.filter((p) => p.rule === "release-missing");
    assert.deepEqual(problems.map((p) => [p.path, p.severity, p.message]), [
      ["docs/features/export-logs.md", "warning", "export-logs isn't in the vision's Release table; add its row, with what it needs, so cruze next orders it"],
    ]);
  });

  it("reports leftover template guides, and never a document's length", async () => {
    const h = await exampleProject();
    setVersion(h.files, h.deps.bundle.version);
    edit(h.files, OPEN_SERIAL, "## Decisions\n", `## Decisions\n\n${"word ".repeat(5000)}\n\n- <A choice>\n`);
    assert.deepEqual(await rules(h.deps), [[OPEN_SERIAL, "template-leftover"]]);
  });

  it("warns once a feature is built while the reviewer may still run only what cruze init allowed", async () => {
    const h = await exampleProject();
    setVersion(h.files, h.deps.bundle.version);
    const initCommand = `["claude", "-p", "--allowedTools", "Read Grep Glob Bash(git diff:*) Bash(git log:*) Bash(git show:*) Bash(cruze:*)"]`;
    const config = h.files.files.get(".cruze/config.yaml") ?? "";
    h.files.files.set(".cruze/config.yaml", `${config}\nreview:\n  command: ${initCommand}\n`);
    assert.deepEqual(await rules(h.deps), [[".cruze/config.yaml", "review-tests"]]);
    edit(h.files, ".cruze/config.yaml", "Bash(cruze:*)", "Bash(cruze:*) Bash(cargo test:*)");
    assert.deepEqual(await rules(h.deps), []);
  });

  it("refuses a config from an older Cruze, and warns when the skills don't match this CLI", async () => {
    const h = await exampleProject();
    assert.deepEqual(await rules(h.deps), h.deps.bundle.version === "0.0.19" ? [] : [[".cruze/config.yaml", "cruze-version"]]);
    setVersion(h.files, "0.0.1");
    assert.deepEqual(await rules(h.deps), [[".cruze/config.yaml", "cruze-version"]]);
    edit(h.files, ".cruze/config.yaml", "version: 2", "version: 1");
    assert.match((await validate(h.deps)).problems[0]?.message ?? "", /older Cruze/);
  });
});

describe("starting a document", () => {
  it("creates a feature from its template, ready to fill in", async () => {
    const h = await exampleProject();
    const report = await createDocument(h.deps, "feature", "ssh-hops", "Consoles over SSH hops");
    assert.equal(report.path, "docs/features/ssh-hops.md");
    const text = h.files.files.get(report.path) ?? "";
    assert.match(text, /^# Consoles over SSH hops\n\n- Status: shaped\n/);
    assert.match(text, /### SCN-ssh-hops\.<name>: <Scenario title>/);
  });

  it("refuses a bad slug and a document that already exists", async () => {
    const h = await exampleProject();
    await assert.rejects(createDocument(h.deps, "feature", "SSH_hops"), (e: unknown) => e instanceof CruzeError && e.code === "invalid-slug");
    await assert.rejects(createDocument(h.deps, "vision"), (e: unknown) => e instanceof CruzeError && e.code === "exists");
  });
});
