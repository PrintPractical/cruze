import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { traceTests } from "../src/app/use_cases/check_code.ts";
import { CruzeError } from "../src/domain/cruze_error.ts";
import { OPEN_SERIAL, edit, exampleProject } from "./support/harness.ts";

describe("tracing scenarios to tests", () => {
  it("requires a test for every scenario of every built feature", async () => {
    const h = await exampleProject();
    h.files.files.set("tests/list.rs", "// SCN-list-devices.lists-all\n#[test]\nfn lists_all() {}\n");
    const report = await traceTests(h.deps);
    assert.equal(report.scope, "every built feature");
    assert.deepEqual(report.missing, ["SCN-list-devices.bad-config"]);
    assert.equal(report.passed, false);
    h.files.files.set("tests/config.rs", '#[test]\nfn bad_config() { let _ = "SCN-list-devices.bad-config"; }\n');
    assert.equal((await traceTests(h.deps)).passed, true);
  });

  it("leaves a shaped feature out until it is built, and traces it alone when named", async () => {
    const h = await exampleProject();
    h.files.files.set("tests/all.rs", "// SCN-list-devices.lists-all\n// SCN-list-devices.bad-config\n// SCN-open-serial.attach\n");
    assert.deepEqual((await traceTests(h.deps)).scenarios.map((s) => s.id), ["SCN-list-devices.lists-all", "SCN-list-devices.bad-config"]);
    const one = await traceTests(h.deps, "open-serial");
    assert.deepEqual(one.missing, ["SCN-open-serial.detach", "SCN-open-serial.port-busy"]);
    edit(h.files, OPEN_SERIAL, "- Status: shaped", "- Status: built");
    assert.equal((await traceTests(h.deps)).scenarios.length, 5);
  });

  it("reports a test that names a scenario no feature defines", async () => {
    const h = await exampleProject();
    h.files.files.set("tests/all.rs", "// SCN-list-devices.lists-all\n// SCN-list-devices.bad-config\n\n// SCN-list-devices.renamed\n");
    const report = await traceTests(h.deps);
    assert.deepEqual(report.unknown, [{ id: "SCN-list-devices.renamed", path: "tests/all.rs", line: 4 }]);
    assert.equal(report.passed, false);
  });

  it("refuses a feature that doesn't exist", async () => {
    const h = await exampleProject();
    await assert.rejects(traceTests(h.deps, "teleport"), (e: unknown) => e instanceof CruzeError && e.code === "not-found");
  });
});
