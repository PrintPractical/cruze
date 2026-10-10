/** The grader's prompt, and the verdict line it ends with. */
import type { EvalCase } from "./case_file.ts";
import type { Evidence } from "./evidence.ts";

export type Verdict = { status: "pass" } | { status: "fail"; reason: string };

/** Each block of evidence is cut to this many characters, so the prompt fits an argument. */
const BLOCK_LIMIT = 60_000;

export function graderPrompt(evalCase: EvalCase, agentOutput: string, evidence: Evidence): string {
  return [
    "You are grading one headless agent run of a Cruze eval case. The current directory is the copy of the fixture project the agent worked in; read files there when the check needs more than the evidence below. Judge only what Expected and Check ask for.",
    `# ${evalCase.name}`,
    "## Expected",
    evalCase.expected,
    "## Check",
    evalCase.check,
    "## The agent's output",
    fenced(agentOutput),
    "## git status --short",
    fenced(evidence.status),
    "## git diff",
    fenced(evidence.diff),
    "## Journal (cruze journal list --all --json)",
    fenced(evidence.journal),
    "Give your reasoning, then end your reply with one last line that is exactly `VERDICT: pass` or `VERDICT: fail: <reason>`.",
  ].join("\n\n");
}

/** The last VERDICT line of the grader's reply, or undefined when it gave none. */
export function parseVerdict(reply: string): Verdict | undefined {
  const lines = reply.split("\n").reverse();
  for (const line of lines) {
    const match = line.replace(/^[\s*`]+|[\s*`]+$/g, "").match(/^VERDICT:\s*(pass|fail)\b\s*(?::\s*(.*))?$/i);
    if (match === null) continue;
    if (match[1]?.toLowerCase() === "pass") return { status: "pass" };
    return { status: "fail", reason: match[2]?.trim() || "no reason given" };
  }
  return undefined;
}

function fenced(text: string): string {
  const shown = text.length > BLOCK_LIMIT ? `${text.slice(0, BLOCK_LIMIT)}\n[cut after ${BLOCK_LIMIT} characters]` : text;
  return `\`\`\`\`\n${shown.trimEnd()}\n\`\`\`\``;
}
