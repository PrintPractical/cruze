import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { AgentRun, AgentRunner } from "../src/app/ports/agent_runner.ts";
import { runReview } from "../src/app/use_cases/run_review.ts";
import { CruzeError } from "../src/domain/cruze_error.ts";
import { exampleProject } from "./support/harness.ts";

/** Records what it was asked to run and answers with a fixed report. */
class ScriptedRunner implements AgentRunner {
  readonly runs: Array<{ command: string[]; prompt: string }> = [];
  private readonly answer: AgentRun;

  constructor(answer: Partial<Extract<AgentRun, { kind: "finished" }>> | { kind: "missing" } = {}) {
    this.answer = answer.kind === "missing" ? answer : { kind: "finished", exitCode: 0, output: "Blockers: 0. Concerns: 1. Nits: 2.\n", error: "", ...answer };
  }

  async run(command: string[], prompt: string): Promise<AgentRun> {
    this.runs.push({ command, prompt });
    return this.answer;
  }
}

/** Sets `review.command` in the example project's config, which has none. */
function configureReview(h: Awaited<ReturnType<typeof exampleProject>>, command: string[]): void {
  h.files.files.set(".cruze/config.yaml", `${h.files.files.get(".cruze/config.yaml") ?? ""}\nreview:\n  command: ${JSON.stringify(command)}\n`);
}

const rejectsWith = (code: string) => (error: unknown) => error instanceof CruzeError && error.code === code;

describe("running a role in a fresh context", () => {
  it("sends the role's prompt and what it reviews to the configured agent, and returns its report", async () => {
    const h = await exampleProject();
    configureReview(h, ["claude", "-p"]);
    const runner = new ScriptedRunner();
    const report = await runReview({ ...h.deps, runner }, { role: "code-reviewer", item: "open-serial", base: "main" });
    assert.equal(report.status === "reported" && report.report, "Blockers: 0. Concerns: 1. Nits: 2.");
    const [run] = runner.runs;
    assert.deepEqual(run?.command, ["claude", "-p"]);
    assert.match(run?.prompt ?? "", /^# Code reviewer\n/);
    assert.match(run?.prompt ?? "", /- Under review: the feature in `docs\/features\/open-serial\.md`/);
    assert.match(run?.prompt ?? "", /run `git diff main`/);
  });

  it("refuses an unknown role and an unknown feature, and reports a failed agent run with its error", async () => {
    const h = await exampleProject();
    configureReview(h, ["claude", "-p"]);
    await assert.rejects(runReview({ ...h.deps, runner: new ScriptedRunner() }, { role: "critic" }), rejectsWith("unknown-role"));
    await assert.rejects(runReview({ ...h.deps, runner: new ScriptedRunner() }, { role: "code-reviewer", item: "teleport" }), rejectsWith("not-found"));
    const failing = new ScriptedRunner({ exitCode: 1, output: "", error: "not logged in" });
    await assert.rejects(runReview({ ...h.deps, runner: failing }, { role: "researcher" }), (e: unknown) => rejectsWith("review-failed")(e) && /not logged in/.test((e as Error).message));
  });

  it("hands the prompt back to run in a helper when no review agent is configured", async () => {
    const h = await exampleProject();
    const runner = new ScriptedRunner();
    const report = await runReview({ ...h.deps, runner }, { role: "code-reviewer", item: "open-serial" });
    assert.equal(report.status, "run-in-helper");
    assert.deepEqual(runner.runs, []);
    if (report.status !== "run-in-helper") return;
    assert.match(report.instruction, /^No review agent is configured under review\.command\./);
    assert.match(report.prompt, /^# Code reviewer\n/);
  });

  it("hands the prompt back to run in a helper when the configured agent isn't installed", async () => {
    const h = await exampleProject();
    configureReview(h, ["claude", "-p"]);
    const runner = new ScriptedRunner({ kind: "missing" });
    const report = await runReview({ ...h.deps, runner }, { role: "code-reviewer", item: "open-serial", base: "main" });
    assert.equal(report.status, "run-in-helper");
    if (report.status !== "run-in-helper") return;
    assert.match(report.instruction, /^claude is not installed/);
    assert.equal(report.prompt, runner.runs[0]?.prompt);
  });
});
