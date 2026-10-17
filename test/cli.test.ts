import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readlinkSync, rmSync, writeFileSync } from "node:fs";
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
    assert.match(readFileSync(join(repo, ".claude/skills/cruze-shape/SKILL.md"), "utf8"), /name: cruze-shape/);
    assert.equal(readlinkSync(join(repo, "CLAUDE.md")), "AGENTS.md");
    assert.equal(stderr, "");
    assert.match(cruze(emptyRepo(), "init", "--name", "Smoke Test", "--yes", "--text").stdout, /Initialized Smoke Test/);
  });

  it("initializes a repository for another agent without Claude Code's files, and hands its reviews to a helper", () => {
    const repo = emptyRepo();
    const init = cruze(repo, "init", "--name", "Smoke Test", "--agent", "other", "--yes");
    assert.equal(init.code, 0, init.stderr);
    assert.equal(existsSync(join(repo, "CLAUDE.md")), false);
    assert.equal(existsSync(join(repo, ".claude")), false);
    assert.match(readFileSync(join(repo, ".agents/skills/cruze-build/SKILL.md"), "utf8"), /name: cruze-build/);
    const review = cruze(repo, "review", "code-reviewer");
    assert.equal(review.code, 0, review.stderr);
    assert.equal(JSON.parse(review.stdout).status, "run-in-helper");
  });

  it("reinstalls skills idempotently", () => {
    const repo = emptyRepo();
    cruze(repo, "init", "--name", "Twice", "--yes");
    const { code, stdout } = cruze(repo, "install");
    assert.equal(code, 0);
    assert.deepEqual(JSON.parse(stdout).removed, []);
  });

  it("prints the package version", () => {
    const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
    assert.equal(cruze(emptyRepo(), "--version").stdout.trim(), pkg.version);
  });

  it("takes a new project from init through envision to its first feature", () => {
    const repo = emptyRepo();
    assert.equal(cruze(repo, "init", "--name", "Smoke Test", "--yes").code, 0);
    assert.equal(JSON.parse(cruze(repo, "next").stdout).reason, "the project has no vision yet");
    assert.equal(cruze(repo, "new", "vision").code, 0);
    const invalid = JSON.parse(cruze(repo, "validate").stdout);
    assert.equal(invalid.valid, false, "a fresh template still holds its guides");
    assert.ok(invalid.problems.some((p: { rule: string }) => p.rule === "template-leftover"));
    const refused = cruze(repo, "approve", "vision");
    assert.equal(refused.code, 1);
    assert.match(refused.stderr, /problem\(s\) to fix first/);
    assert.equal(cruze(repo, "new", "feature", "sign-in", "--title", "Sign in").code, 0);
    assert.match(readFileSync(join(repo, "docs/features/sign-in.md"), "utf8"), /^# Sign in\n/);
  });

  it("validates, approves and reports status on a copy of the worked example", () => {
    const repo = emptyRepo();
    cpSync(fileURLToPath(new URL("../examples/console-access", import.meta.url)), repo, { recursive: true });
    const validated = cruze(repo, "validate");
    assert.equal(validated.code, 0, validated.stderr);
    assert.equal(JSON.parse(validated.stdout).valid, true);
    for (const doc of ["vision", "architecture", "open-serial"]) assert.equal(cruze(repo, "approve", doc).code, 0);
    const status = JSON.parse(cruze(repo, "status").stdout);
    assert.deepEqual(status.documents.map((d: { state: string }) => d.state), ["approved", "approved"]);
    assert.deepEqual(status.next, { step: "build", target: "open-serial", reason: "open-serial is approved and not built" });
    assert.match(cruze(repo, "status", "--text").stdout, /^ssh-hops: not-shaped, needs open-serial$/m);
    const trace = cruze(repo, "trace", "--text");
    assert.equal(trace.code, 1);
    assert.match(trace.stdout, /missing test for SCN-list-devices\.lists-all/);
  });

  it("stops quietly when its reader closes the pipe early", async () => {
    const repo = emptyRepo();
    cpSync(fileURLToPath(new URL("../examples/console-access", import.meta.url)), repo, { recursive: true });
    const child = spawn(process.execPath, [MAIN, "status", "--json"], { cwd: repo, stdio: ["ignore", "pipe", "pipe"] });
    let stderr = "";
    child.stderr.on("data", (chunk: Buffer) => (stderr += chunk.toString()));
    child.stdout.destroy();
    const code = await new Promise<number | null>((resolve) => child.on("close", resolve));
    assert.doesNotMatch(stderr, /Error/);
    assert.equal(code, 0);
  });

  it("exits with 2 and shows usage for an unknown command", () => {
    const { code, stderr } = cruze(emptyRepo(), "land");
    assert.equal(code, 2);
    assert.match(stderr, /Unknown command: land/);
    assert.match(stderr, /Usage: cruze/);
  });

  it("checks one file of a 10,000-line repository in under a second", () => {
    const repo = emptyRepo();
    cpSync(fileURLToPath(new URL("../examples/console-access", import.meta.url)), repo, { recursive: true });
    const dirs = ["src/domain", "src/app", "src/adapters", "src/cli"];
    for (let i = 0; i < 100; i++) {
      const lines = ["use crate::domain::device::Device;", "use std::collections::HashMap;"];
      while (lines.length < 100) lines.push(`fn f${lines.length}() -> u32 { ${lines.length} }`);
      const dir = join(repo, dirs[i % dirs.length] ?? "src");
      mkdirSync(dir, { recursive: true });
      writeFileSync(join(dir, `generated_${i}.rs`), `${lines.join("\n")}\n`);
    }
    const started = performance.now();
    const { code, stderr } = cruze(repo, "check", "src/domain/generated_0.rs", "--json");
    const elapsed = performance.now() - started;
    assert.equal(code, 0, stderr);
    assert.ok(elapsed < 1000, `cruze check took ${Math.round(elapsed)} ms`);
  });

  it("works on the enclosing project from a subdirectory, with file arguments relative to it", () => {
    const repo = emptyRepo();
    cpSync(fileURLToPath(new URL("../examples/console-access", import.meta.url)), repo, { recursive: true });
    mkdirSync(join(repo, "src/domain"), { recursive: true });
    writeFileSync(join(repo, "src/domain/hop.rs"), "pub struct Hop;\n");
    const sub = join(repo, "src");
    assert.equal(JSON.parse(cruze(sub, "validate").stdout).valid, true);
    const checked = cruze(sub, "check", "domain/hop.rs");
    assert.equal(checked.code, 0, checked.stderr);
    assert.equal(JSON.parse(checked.stdout).checked, 1);
  });

  it("notes on stderr when the project's skills are older than the CLI, even when the command fails", () => {
    const repo = emptyRepo();
    assert.equal(cruze(repo, "init", "--name", "Smoke Test", "--yes").code, 0);
    const config = join(repo, ".cruze/config.yaml");
    writeFileSync(config, readFileSync(config, "utf8").replace(/^cruze: .*$/m, 'cruze: "0.0.0"'));
    const failed = cruze(repo, "approve", "vision");
    assert.equal(failed.code, 1);
    assert.match(failed.stderr, /cruze: note: the project's skills are from Cruze 0\.0\.0, older than this CLI/);
    assert.doesNotMatch(cruze(emptyRepo(), "status").stderr, /note:/);
  });

  it("hands the review prompt back to the agent when the configured review agent isn't installed", () => {
    const repo = emptyRepo();
    assert.equal(cruze(repo, "init", "--name", "Smoke Test", "--yes").code, 0);
    const config = join(repo, ".cruze/config.yaml");
    writeFileSync(config, readFileSync(config, "utf8").replace(/^  command: .*$/m, '  command: ["cruze-no-such-agent", "-p"]'));
    const { code, stdout, stderr } = cruze(repo, "review", "code-reviewer");
    assert.equal(code, 0, stderr);
    const report = JSON.parse(stdout);
    assert.equal(report.status, "run-in-helper");
    assert.match(report.instruction, /^cruze-no-such-agent is not installed/);
    assert.match(report.prompt, /^# Code reviewer\n/);
  });

  it("prints its result in one format on stdout, and refuses an option the command doesn't take", () => {
    const repo = emptyRepo();
    cpSync(fileURLToPath(new URL("../examples/console-access", import.meta.url)), repo, { recursive: true });
    const text = cruze(repo, "next", "--text");
    assert.match(text.stdout, /^Next: envision: /);
    assert.equal(JSON.parse(cruze(repo, "next").stdout).step, "envision");
    assert.match(cruze(repo, "next", "--json", "--text").stderr, /--json and --text are alternatives/);
    const validate = cruze(repo, "validate", "--feature", "nonsense");
    assert.equal(validate.code, 2);
    assert.equal(JSON.parse(validate.stdout).error.code, "usage");
    assert.match(validate.stderr, /cruze validate doesn't take --feature; it takes no options/);
  });
});
