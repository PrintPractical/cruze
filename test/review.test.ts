import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { AgentRun, AgentRunner } from "../src/app/ports/agent_runner.ts";
import { runReview } from "../src/app/use_cases/run_review.ts";
import { CruzeError } from "../src/domain/cruze_error.ts";
import { CHANGE_01, exampleProject } from "./support/harness.ts";

/** Records what it was asked to run and answers with a fixed report. */
class ScriptedRunner implements AgentRunner {
  readonly runs: Array<{ command: string[]; prompt: string }> = [];
  private readonly answer: AgentRun;

  constructor(answer: Partial<AgentRun> = {}) {
    this.answer = { exitCode: 0, output: "Blockers: 0. Concerns: 1. Nits: 2.\n", error: "", ...answer };
  }

  async run(command: string[], prompt: string): Promise<AgentRun> {
    this.runs.push({ command, prompt });
    return this.answer;
  }
}

const rejectsWith = (code: string) => (error: unknown) => error instanceof CruzeError && error.code === code;

describe("running a role in a fresh context", () => {
  it("sends the role's prompt and what it reviews to the configured agent, and returns its report", async () => {
    const h = await exampleProject();
    const runner = new ScriptedRunner();
    const report = await runReview({ ...h.deps, runner }, { role: "code-reviewer", item: CHANGE_01, base: "main" });
    assert.equal(report.report, "Blockers: 0. Concerns: 1. Nits: 2.");
    const [run] = runner.runs;
    assert.deepEqual(run?.command.slice(0, 2), ["claude", "-p"]);
    assert.match(run?.prompt ?? "", /^# Code reviewer\n/);
    assert.match(run?.prompt ?? "", /- Under review: 2026-09-25-open-console\/01-local-serial \(`\.cruze\/features\/2026-09-25-open-console\/changes\/01-local-serial\/change\.md`\)/);
    assert.match(run?.prompt ?? "", /- Its feature: `\.cruze\/features\/2026-09-25-open-console\/feature\.md`/);
    assert.match(run?.prompt ?? "", /run `git diff main`/);
  });

  it("gives round 2 the round-1 blockers, and uses the project's own command when it sets one", async () => {
    const h = await exampleProject();
    h.files.files.set(".cruze/config.yaml", `${h.files.files.get(".cruze/config.yaml") ?? ""}\nreview:\n  command: ["codex", "exec", "-"]\n`);
    const runner = new ScriptedRunner();
    await runReview({ ...h.deps, runner }, { role: "design-reviewer", round: 2, blockers: "1. Placement: EscapeDetector has no file" });
    assert.deepEqual(runner.runs[0]?.command, ["codex", "exec", "-"]);
    assert.match(runner.runs[0]?.prompt ?? "", /- Round: 2\n/);
    assert.match(runner.runs[0]?.prompt ?? "", /Round-1 blockers to check:\n\n1\. Placement: EscapeDetector has no file/);
  });

  it("refuses an unknown role, and reports a failed agent run with its error", async () => {
    const h = await exampleProject();
    await assert.rejects(runReview({ ...h.deps, runner: new ScriptedRunner() }, { role: "critic" }), rejectsWith("unknown-role"));
    const failing = new ScriptedRunner({ exitCode: 1, output: "", error: "not logged in" });
    await assert.rejects(runReview({ ...h.deps, runner: failing }, { role: "verifier", item: CHANGE_01 }), (e: unknown) => rejectsWith("review-failed")(e) && /not logged in/.test((e as Error).message));
  });
});
