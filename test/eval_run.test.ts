import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { chmodSync, existsSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { after, describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { DEFAULT_TOOLS, parseCase } from "../evals/run/case_file.ts";

// The graded runner, through its command line, with a fake agent in place of `claude` so nothing is paid for.
const REPO = fileURLToPath(new URL("..", import.meta.url));
const scratch = mkdtempSync(join(tmpdir(), "cruze-eval-test-"));
const kept: string[] = [];

after(() => [scratch, ...kept].forEach((dir) => rmSync(dir, { recursive: true, force: true })));

// Grades when the prompt holds a VERDICT instruction; otherwise records how it was run, and says `ran`.
const FAKE_AGENT_SCRIPT = `
import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";
const prompt = process.argv[process.argv.indexOf("-p") + 1] ?? "";
if (prompt.includes("VERDICT:")) {
  writeFileSync("grader-prompt.txt", prompt);
  process.stdout.write(process.env.FAKE_VERDICT === "fail" ? "Looked at the diff.\\nVERDICT: fail: nope\\n" : "Looked at the diff.\\n**VERDICT: pass**\\n");
} else {
  const cruze = execSync("command -v cruze", { encoding: "utf8" }).trim();
  const version = execSync("cruze --version", { encoding: "utf8" }).trim();
  writeFileSync("agent-run.json", JSON.stringify({ argv: process.argv.slice(2), cwd: process.cwd(), cruze, version }));
  process.stdout.write("ran\\n");
}
`;

function fakeAgent(): string {
  const script = join(scratch, "fake_agent.mjs");
  writeFileSync(script, FAKE_AGENT_SCRIPT);
  const agent = join(scratch, "fake-agent");
  writeFileSync(agent, `#!/bin/sh\nexec "${process.execPath}" "${script}" "$@"\n`);
  chmodSync(agent, 0o755);
  return agent;
}

const HEADER = ["# A case for the runner", "", "- Proposal: none", "- Evidence: none", "- Asset: none", "", "## Situation", "", "The fixture's README gains a line.", "", "## Expected", "", "The agent reports that it ran.", "", "## Check", ""];
const MANUAL_CASE = [...HEADER, "Fixture run: by hand.", ""].join("\n");
const RUNNABLE_CASE = [
  ...HEADER,
  "Fixture run: the output says `ran`.",
  "",
  "## Run",
  "",
  "- Setup:",
  "",
  "  ```sh",
  "  printf '\\nAdded by setup.\\n' >> README.md",
  "  ```",
  "",
  "```",
  "Say ran and stop.",
  "```",
  "",
  "- Tools: Read,Bash",
  "",
].join("\n");

function writeCase(name: string, text: string): string {
  const path = join(scratch, name);
  writeFileSync(path, text);
  return path;
}

function runEvals(env: Record<string, string>, ...args: string[]) {
  const result = spawnSync(process.execPath, ["evals/run.ts", ...args, "--agent", fakeAgent()], {
    cwd: REPO,
    encoding: "utf8",
    env: { ...process.env, ...env },
    stdio: ["ignore", "pipe", "pipe"],
  });
  return { code: result.status, stdout: result.stdout, stderr: result.stderr };
}

describe("the graded eval runner", () => {
  it("runs a case's prompt on a prepared fixture copy, grades it and reports a pass", () => {
    const out = join(scratch, "reports/report.json");
    const { code, stdout, stderr } = runEvals({}, writeCase("runnable.md", RUNNABLE_CASE), "--keep", "--out", out);
    assert.equal(code, 0, stderr);
    const report = JSON.parse(stdout);
    assert.equal(readFileSync(out, "utf8"), stdout);
    assert.deepEqual({ passed: report.passed, failed: report.failed, manual: report.manual, errors: report.errors }, { passed: 1, failed: 0, manual: 0, errors: 0 });
    const [result] = report.cases;
    assert.equal(result.status, "pass");
    assert.equal(result.reason, undefined);
    const workdir: string = result.workdir;
    kept.push(dirname(workdir));

    // The copy: the setup ran, the skills were installed from source, and the work was committed before the agent started.
    assert.match(readFileSync(join(workdir, "README.md"), "utf8"), /Added by setup\.\n$/);
    assert.ok(existsSync(join(workdir, ".claude/skills/cruze-plan/SKILL.md")));
    assert.ok(existsSync(join(workdir, ".agents/skills/cruze-formats/SKILL.md")));
    const log = spawnSync("git", ["log", "--format=%s"], { cwd: workdir, encoding: "utf8" }).stdout;
    assert.deepEqual(log.trim().split("\n"), ["prepared", "fixture"]);

    // The agent: run in the copy with the case's tools, and with `cruze` resolving to the source CLI.
    const run = JSON.parse(readFileSync(join(workdir, "agent-run.json"), "utf8"));
    assert.deepEqual(run.argv, ["-p", "Say ran and stop.", "--allowedTools", "Read,Bash", "--permission-mode", "acceptEdits"]);
    assert.equal(realpathSync(run.cwd), realpathSync(workdir));
    assert.equal(run.cruze, join(dirname(workdir), "bin/cruze"));
    assert.match(readFileSync(run.cruze, "utf8"), /src\/main\.ts/);
    assert.equal(run.version, JSON.parse(readFileSync(join(REPO, "package.json"), "utf8")).version);

    // The grader: given the case's Expected and Check, the agent's output, the diff with the agent's new file, and the journal.
    const prompt = readFileSync(join(workdir, "grader-prompt.txt"), "utf8");
    assert.match(prompt, /## Expected\n\nThe agent reports that it ran\./);
    assert.match(prompt, /## Check\n\nFixture run: the output says `ran`\./);
    assert.match(prompt, /## The agent's output\n\n````\nran\n````/);
    assert.match(prompt, /## git status --short\n\n````\n\?\? agent-run\.json/);
    assert.match(prompt, /\+\+\+ b\/agent-run\.json/);
    assert.match(prompt, /## Journal \(cruze journal list --all --json\)\n\n````\n\[\]/);
    assert.match(prompt, /VERDICT: pass/);
  });

  it("reports a case without a Run section as manual, without running anything", () => {
    const { code, stdout } = runEvals({}, writeCase("manual.md", MANUAL_CASE));
    assert.equal(code, 0);
    const report = JSON.parse(stdout);
    assert.equal(report.manual, 1);
    assert.deepEqual(report.cases, [{ path: report.cases[0].path, status: "manual" }]);
    assert.match(report.cases[0].path, /manual\.md$/);
  });

  it("reports a failing verdict with the grader's reason, keeps the copy and exits 1", () => {
    const { code, stdout } = runEvals({ FAKE_VERDICT: "fail" }, writeCase("failing.md", RUNNABLE_CASE));
    assert.equal(code, 1);
    const report = JSON.parse(stdout);
    assert.equal(report.failed, 1);
    const [result] = report.cases;
    assert.equal(result.status, "fail");
    assert.equal(result.reason, "nope");
    assert.ok(existsSync(result.workdir), "the failed case's copy is kept");
    kept.push(dirname(result.workdir));
  });

  it("reads a Run section's setup, prompt and tools, with the tools defaulting", () => {
    const parsed = parseCase(RUNNABLE_CASE);
    assert.equal(parsed.name, "A case for the runner");
    assert.equal(parsed.expected, "The agent reports that it ran.");
    assert.equal(parsed.check, "Fixture run: the output says `ran`.");
    assert.deepEqual(parsed.run, { setup: "printf '\\nAdded by setup.\\n' >> README.md", prompt: "Say ran and stop.", tools: "Read,Bash" });

    const defaults = parseCase(RUNNABLE_CASE.replace("- Tools: Read,Bash\n", ""));
    assert.equal(defaults.run?.tools, DEFAULT_TOOLS);
    assert.equal(defaults.run?.setup, "printf '\\nAdded by setup.\\n' >> README.md");

    assert.equal(parseCase(MANUAL_CASE).run, undefined);
    assert.throws(() => parseCase([...HEADER, "Fixture run.", "", "## Run", "", "- Tools: Read", ""].join("\n")), /no fenced block holding the prompt/);
  });
});
