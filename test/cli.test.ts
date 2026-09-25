import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, describe, it } from "node:test";
import { fileURLToPath } from "node:url";

// Smoke test through the real CLI, filesystem and bundle.
const MAIN = fileURLToPath(new URL("../src/main.ts", import.meta.url));
const workspaces: string[] = [];

function cruze(cwd: string, ...args: string[]) {
  const result = spawnSync(process.execPath, [MAIN, ...args], { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  return { code: result.status, stdout: result.stdout, stderr: result.stderr };
}

function emptyRepo(): string {
  const dir = mkdtempSync(join(tmpdir(), "cruze-cli-"));
  workspaces.push(dir);
  return dir;
}

after(() => workspaces.forEach((dir) => rmSync(dir, { recursive: true, force: true })));

describe("the cruze command", () => {
  it("initializes a repository and reports the result as JSON to an agent", () => {
    const repo = emptyRepo();
    const { code, stdout, stderr } = cruze(repo, "init", "--name", "Smoke Test", "--yes");

    assert.equal(code, 0, stderr);
    const report = JSON.parse(stdout);
    assert.equal(report.project, "Smoke Test");
    assert.equal(readFileSync(join(repo, "README.md"), "utf8"), "# Smoke Test\n");
    assert.match(readFileSync(join(repo, ".claude/skills/cruze-about/SKILL.md"), "utf8"), /name: cruze-about/);
    assert.match(stderr, /Initialized Smoke Test/);
  });

  it("reinstalls skills idempotently", () => {
    const repo = emptyRepo();
    cruze(repo, "init", "--name", "Twice", "--yes");
    const { code, stdout } = cruze(repo, "install");

    assert.equal(code, 0);
    assert.deepEqual(JSON.parse(stdout).removed, []);
    assert.match(readFileSync(join(repo, ".agents/skills/cruze-about/SKILL.md"), "utf8"), /cruze-about/);
  });

  it("prints the package version", () => {
    const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
    assert.equal(cruze(emptyRepo(), "--version").stdout.trim(), pkg.version);
  });

  it("validates, approves and reports status on a copy of the worked example", () => {
    const repo = emptyRepo();
    cpSync(fileURLToPath(new URL("../examples/console-access", import.meta.url)), repo, { recursive: true });
    const validated = cruze(repo, "validate");
    assert.equal(validated.code, 0, validated.stderr);
    assert.equal(JSON.parse(validated.stdout).valid, true);
    assert.equal(cruze(repo, "approve", "vision").code, 0);
    const status = JSON.parse(cruze(repo, "status").stdout);
    assert.equal(status.documents[0].state, "approved");
    const gate = cruze(repo, "status", "--gate", "build");
    assert.equal(gate.code, 1);
    assert.match(gate.stderr, /Build gate blocked/);
  });

  it("exits with 2 and shows usage for an unknown command", () => {
    const { code, stderr } = cruze(emptyRepo(), "frobnicate");
    assert.equal(code, 2);
    assert.match(stderr, /Unknown command: frobnicate/);
    assert.match(stderr, /Usage: cruze/);
  });

  it("checks one file of a 10,000-line repository in under a second, for the per-task check", () => {
    const repo = emptyRepo();
    cpSync(fileURLToPath(new URL("../examples/console-access", import.meta.url)), repo, { recursive: true });
    const dirs = ["src/inventory/domain", "src/inventory/app", "src/inventory/adapters", "src/access/domain", "src/access/app", "src/access/adapters", "src/cli"];
    for (let i = 0; i < 100; i++) {
      const lines = ["use crate::inventory::domain::device::Device;", "use std::collections::HashMap;"];
      while (lines.length < 100) lines.push(`fn f${lines.length}() -> u32 { ${lines.length} }`);
      const dir = join(repo, dirs[i % dirs.length] ?? "src");
      mkdirSync(dir, { recursive: true });
      writeFileSync(join(dir, `generated_${i}.rs`), `${lines.join("\n")}\n`);
    }
    const started = performance.now();
    const { code, stderr } = cruze(repo, "check", "src/inventory/domain/generated_0.rs", "--json");
    const elapsed = performance.now() - started;
    assert.equal(code, 0, stderr);
    assert.ok(elapsed < 1000, `cruze check --file took ${Math.round(elapsed)} ms`);
  });
});
