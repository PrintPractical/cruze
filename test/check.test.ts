import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { checkCode } from "../src/app/use_cases/check_code.ts";
import { exampleProject, type Harness } from "./support/harness.ts";

/** A consolectl source tree that follows the example's layer rules. */
function writeSources(h: Harness, overrides: Record<string, string> = {}): void {
  const sources: Record<string, string> = {
    "src/main.rs": "use crate::cli::args::Args;\nuse crate::adapters::toml_devices::TomlDevices;\nfn main() {}\n",
    "src/domain/device.rs": "use super::console_path::ConsolePath;\npub struct Device { path: ConsolePath }\n",
    "src/domain/console_path.rs": "pub struct ConsolePath;\n",
    "src/app/list_devices.rs": "use crate::domain::device::Device;\nuse crate::app::ports::DeviceSource;\n",
    "src/app/ports.rs": "use crate::domain::device::Device;\npub trait DeviceSource {}\n",
    "src/adapters/toml_devices.rs": "use crate::app::ports::DeviceSource;\nuse serde::Deserialize;\npub struct TomlDevices;\n",
    "src/cli/args.rs": "use crate::app::list_devices::ListDevices;\npub struct Args;\n",
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
    writeSources(h, { "src/domain/device.rs": "pub struct Device;\nuse crate::adapters::toml_devices::TomlDevices;\n" });
    const report = await checkCode(h.deps, { ci: false });
    assert.equal(report.passed, false);
    assert.deepEqual(report.findings.map((f) => [f.path, f.line, f.rule]), [["src/domain/device.rs", 2, "layer"]]);
    assert.match(report.findings[0]?.message ?? "", /domain may not import adapters/);
  });

  it("follows brace groups in Rust use statements", async () => {
    const h = await exampleProject();
    writeSources(h, { "src/domain/device.rs": "use crate::{domain::console_path::ConsolePath, app::ports::DeviceSource};\n" });
    const report = await checkCode(h.deps, { ci: false });
    assert.deepEqual(report.findings.map((f) => f.message), ["domain may not import app (src/app/ports.rs)"]);
  });

  it("warns on budgets locally and fails them in CI, except for files listed with a reason", async () => {
    const h = await exampleProject();
    const long = `${"// line\n".repeat(610)}`;
    const manyTypes = Array.from({ length: 13 }, (_, i) => `pub struct T${i};`).join("\n");
    writeSources(h, { "src/domain/console_path.rs": long, "src/domain/device.rs": manyTypes, "src/cli/args.rs": long });
    const local = await checkCode(h.deps, { ci: false });
    assert.equal(local.passed, true);
    assert.deepEqual(local.findings.map((f) => [f.path, f.rule]), [["src/domain/console_path.rs", "max-lines"], ["src/domain/device.rs", "max-types"]]);
    assert.equal((await checkCode(h.deps, { ci: true })).passed, false);
  });

  it("leaves a Rust file's inline test modules out of its budgets", async () => {
    const h = await exampleProject();
    const tests = `#[cfg(test)]\nmod tests {\n    use super::*;\n${"    #[test]\n    fn case() {}\n".repeat(60)}}\n`;
    writeSources(h, { "src/domain/console_path.rs": `${"// line\n".repeat(550)}${tests}` });
    assert.deepEqual((await checkCode(h.deps, { ci: true })).findings, []);
  });

  it("flags Rust tests split out into files under src/", async () => {
    const h = await exampleProject();
    writeSources(h, { "src/domain/device/tests.rs": "use super::*;\n", "src/domain/hop_tests.rs": "use super::*;\n" });
    const report = await checkCode(h.deps, { ci: true });
    assert.deepEqual(report.findings.filter((f) => f.rule === "test-placement").map((f) => f.path).sort(), ["src/domain/device/tests.rs", "src/domain/hop_tests.rs"]);
    assert.equal(report.passed, false);
  });

  it("checks only the named file when asked", async () => {
    const h = await exampleProject();
    writeSources(h, { "src/domain/device.rs": "use crate::adapters::toml_devices::TomlDevices;\n" });
    const report = await checkCode(h.deps, { ci: false, files: ["src/domain/console_path.rs"] });
    assert.equal(report.checked, 1);
    assert.equal(report.passed, true);
  });

  it("resolves relative TypeScript imports", async () => {
    const h = await exampleProject();
    h.files.files.set(".cruze/config.yaml", 'version: 2\nproject: "TS"\nsource: ["lib/**/*.ts"]\ntests: []\nlayers:\n  - name: domain\n    paths: ["lib/domain/**"]\n    may_import: []\n  - name: adapters\n    paths: ["lib/adapters/**"]\n    may_import: [domain]\n');
    h.files.files.set("lib/domain/order.ts", 'import { saveOrder } from "../adapters/store.js";\nexport class Order {}\n');
    h.files.files.set("lib/adapters/store.ts", 'import { Order } from "../domain/order.ts";\nexport function saveOrder(o: Order) {}\n');
    const report = await checkCode(h.deps, { ci: false });
    assert.deepEqual(report.findings.filter((f) => f.rule === "layer").map((f) => f.path), ["lib/domain/order.ts"]);
  });
});
