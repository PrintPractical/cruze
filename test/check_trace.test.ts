import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { checkCode, traceTests } from "../src/app/use_cases/check_code.ts";
import { BRANCH_01, CHANGE_01, exampleProject, type Harness } from "./support/harness.ts";

/** A consolectl source tree that follows the example's layer rules. */
function writeSources(h: Harness, overrides: Record<string, string> = {}): void {
  const sources: Record<string, string> = {
    "src/main.rs": "use crate::cli::args::Args;\nuse crate::inventory::adapters::toml_catalog::TomlCatalog;\nfn main() {}\n",
    "src/lib.rs": "pub mod inventory;\npub mod access;\npub mod cli;\n",
    "src/inventory/domain/device.rs": "use super::console_path::ConsolePath;\npub struct Device { path: ConsolePath }\n",
    "src/inventory/domain/console_path.rs": "pub struct ConsolePath;\n",
    "src/inventory/app/list_devices.rs": "use crate::inventory::domain::device::Device;\nuse crate::inventory::app::ports::device_catalog::DeviceCatalog;\n",
    "src/inventory/app/ports/device_catalog.rs": "use crate::inventory::domain::device::Device;\npub trait DeviceCatalog {}\n",
    "src/inventory/adapters/toml_catalog.rs": "use crate::inventory::app::ports::device_catalog::DeviceCatalog;\nuse serde::Deserialize;\npub struct TomlCatalog;\n",
    "src/access/domain/console_session.rs": "use crate::inventory::domain::console_path::ConsolePath;\npub struct ConsoleSession;\n",
    "src/access/adapters/serial_connector.rs": "use super::super::app::ports::hop_connector::HopConnector;\npub struct SerialConnector;\n",
    "src/access/app/ports/hop_connector.rs": "pub trait HopConnector {}\n",
    "src/cli/args.rs": "use crate::inventory::app::list_devices::ListDevices;\npub struct Args;\n",
    ...overrides,
  };
  for (const [path, text] of Object.entries(sources)) h.files.files.set(path, text);
}

describe("checking source code", () => {
  it("passes a tree that follows the layer rules", async () => {
    const h = await exampleProject();
    writeSources(h);
    const report = await checkCode(h.deps, { ci: true });
    assert.deepEqual(report.findings, []);
    assert.equal(report.passed, true);
  });

  it("fails a domain module that imports an adapter, naming both layers and the line", async () => {
    const h = await exampleProject();
    writeSources(h, { "src/access/domain/console_session.rs": "pub struct ConsoleSession;\nuse crate::access::adapters::serial_connector::SerialConnector;\n" });
    const report = await checkCode(h.deps, { ci: false });
    assert.equal(report.passed, false);
    assert.deepEqual(report.findings.map((f) => [f.path, f.line, f.rule]), [["src/access/domain/console_session.rs", 2, "layer"]]);
    assert.match(report.findings[0]?.message ?? "", /access-domain may not import access-adapters/);
  });

  it("follows brace groups and super:: paths in Rust use statements", async () => {
    const h = await exampleProject();
    writeSources(h, { "src/inventory/app/list_devices.rs": "use crate::{inventory::domain::device::Device, access::domain::console_session::ConsoleSession};\n" });
    const report = await checkCode(h.deps, { ci: false });
    assert.deepEqual(report.findings.map((f) => f.message), ["inventory-app may not import access-domain (src/access/domain/console_session.rs)"]);
  });

  it("warns on budgets locally and fails them in CI, except for files listed with a reason", async () => {
    const h = await exampleProject();
    const long = `${"// line\n".repeat(260)}`;
    const manyTypes = Array.from({ length: 6 }, (_, i) => `pub struct T${i};`).join("\n");
    writeSources(h, { "src/inventory/domain/hop.rs": long, "src/inventory/domain/inventory.rs": manyTypes, "src/cli/args.rs": long });
    const local = await checkCode(h.deps, { ci: false });
    assert.equal(local.passed, true);
    assert.deepEqual(local.findings.map((f) => [f.path, f.rule]), [["src/inventory/domain/hop.rs", "max-lines"], ["src/inventory/domain/inventory.rs", "max-types"]]);
    assert.equal((await checkCode(h.deps, { ci: true })).passed, false);
  });

  it("flags a file outside every module in the module map", async () => {
    const h = await exampleProject();
    writeSources(h, { "src/helpers.rs": "pub fn help() {}\n" });
    const report = await checkCode(h.deps, { ci: false });
    assert.ok(report.findings.some((f) => f.path === "src/helpers.rs" && f.rule === "outside-module-map"));
  });

  it("checks only the named file when asked, for the fast per-task check", async () => {
    const h = await exampleProject();
    writeSources(h, { "src/access/domain/console_session.rs": "use crate::access::adapters::serial_connector::SerialConnector;\n" });
    const report = await checkCode(h.deps, { ci: false, files: ["src/inventory/domain/device.rs"] });
    assert.equal(report.checked, 1);
    assert.equal(report.passed, true);
  });

  it("resolves relative TypeScript imports", async () => {
    const h = await exampleProject();
    h.files.files.set(".cruze/config.yaml", 'version: 1\nproject: "TS"\ntracker: markdown\nsource: ["lib/**/*.ts"]\ntests: []\ncheck:\n  max_lines: 250\n  max_types: 5\n  exceptions: []\nlayers:\n  - name: domain\n    paths: ["lib/domain/**"]\n    may_import: []\n  - name: adapters\n    paths: ["lib/adapters/**"]\n    may_import: [domain]\n');
    h.files.files.set("lib/domain/order.ts", 'import { saveOrder } from "../adapters/store.js";\nexport class Order {}\n');
    h.files.files.set("lib/adapters/store.ts", 'import { Order } from "../domain/order.ts";\nexport function saveOrder(o: Order) {}\n');
    const report = await checkCode(h.deps, { ci: false });
    assert.deepEqual(report.findings.filter((f) => f.rule === "layer").map((f) => f.path), ["lib/domain/order.ts"]);
  });
});

describe("tracing scenarios to tests", () => {
  it("lists every delivered scenario of this branch's change that no test names", async () => {
    const h = await exampleProject();
    h.repository.branch = BRANCH_01;
    h.files.files.set("tests/access_open_console.rs", "// SCN-access.direct-serial\n#[test]\nfn direct_serial() {}\n// SCN-access.detach\n#[test]\nfn detach() {}\n");
    const report = await traceTests(h.deps, { all: false });
    assert.equal(report.scope, CHANGE_01);
    assert.deepEqual(report.missing, ["SCN-access.escape-not-completed", "SCN-access.serial-busy", "SCN-access.unknown-device-suggestion"]);
    assert.equal(report.passed, false);
  });

  it("checks every built scenario in the specs for CI, and flags tests citing scenarios nobody defined", async () => {
    const h = await exampleProject();
    h.files.files.set("tests/cli_list.rs", "// SCN-inventory.list-configured\n// SCN-inventory.no-config\n// SCN-inventory.serial-not-last\n// SCN-inventory.renamed-long-ago\n");
    const report = await traceTests(h.deps, { all: true });
    assert.deepEqual(report.missing, []);
    assert.deepEqual(report.unknown.map((u) => [u.id, u.line]), [["SCN-inventory.renamed-long-ago", 4]]);
    assert.equal(report.passed, false);
  });
});
