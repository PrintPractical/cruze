/** One case, end to end: the fixture copy, the agent's run, the evidence, the grader's verdict. */
import { readFileSync } from "node:fs";
import { relative } from "node:path";
import { parseCase, type EvalCase, type RunSection } from "./case_file.ts";
import { gatherEvidence } from "./evidence.ts";
import { prepareFixtureCopy, removeFixtureCopy, type FixtureCopy } from "./fixture_copy.ts";
import { graderPrompt, parseVerdict } from "./grader.ts";
import { AGENT_TIMEOUT_MS, GRADER_TIMEOUT_MS, runHeadless, stderrTail } from "./headless.ts";
import type { CaseResult } from "./report.ts";

export interface CaseRunSettings {
  agent: string;
  fixture: string;
  keep: boolean;
  repoRoot: string;
  /** Progress, written to stderr by the entry point. */
  note: (message: string) => void;
}

export function runCase(path: string, settings: CaseRunSettings): CaseResult {
  const shown = relative(process.cwd(), path) || path;
  const note = (message: string) => settings.note(`${shown}: ${message}`);
  let evalCase: EvalCase;
  try {
    evalCase = parseCase(readFileSync(path, "utf8"));
  } catch (error) {
    return { path: shown, status: "error", reason: message(error) };
  }
  if (evalCase.run === undefined) return { path: shown, status: "manual" };

  let copy: FixtureCopy | undefined;
  let result: CaseResult;
  try {
    note("preparing a fixture copy");
    copy = prepareFixtureCopy(settings.fixture, settings.repoRoot, evalCase.run.setup);
    result = { path: shown, ...grade(evalCase, evalCase.run, copy, settings, note) };
  } catch (error) {
    result = { path: shown, status: "error", reason: message(error) };
  }
  if (copy !== undefined) {
    if (settings.keep || result.status !== "pass") result.workdir = copy.project;
    else removeFixtureCopy(copy);
  }
  note(result.reason === undefined ? result.status : `${result.status}: ${result.reason}`);
  return result;
}

function grade(evalCase: EvalCase, run: RunSection, copy: FixtureCopy, settings: CaseRunSettings, note: (message: string) => void): Omit<CaseResult, "path"> {
  note("running the agent");
  const agentArgs = ["-p", run.prompt, "--allowedTools", run.tools, "--permission-mode", "acceptEdits"];
  const agent = runHeadless(settings.agent, agentArgs, copy.project, copy.env, AGENT_TIMEOUT_MS);
  if (agent.code !== 0) return { status: "error", reason: agent.failure ?? `agent exited ${agent.code}: ${stderrTail(agent.stderr)}` };

  const evidence = gatherEvidence(copy.project, settings.repoRoot);
  note("grading");
  const grader = runHeadless(settings.agent, ["-p", graderPrompt(evalCase, agent.stdout, evidence)], copy.project, copy.env, GRADER_TIMEOUT_MS);
  if (grader.code !== 0) return { status: "error", reason: grader.failure ?? `grader exited ${grader.code}: ${stderrTail(grader.stderr)}` };

  const verdict = parseVerdict(grader.stdout);
  if (verdict === undefined) return { status: "error", reason: "the grader's reply has no VERDICT line" };
  return verdict.status === "pass" ? { status: "pass" } : { status: "fail", reason: verdict.reason };
}

function message(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
