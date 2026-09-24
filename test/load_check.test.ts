import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { loadReport } from "../evals/load_check/load_report.ts";
import { skillFilesRead } from "../evals/load_check/transcript_reads.ts";

const toolUse = (name: string, input: Record<string, unknown>) =>
  JSON.stringify({ type: "assistant", message: { content: [{ type: "text", text: "..." }, { type: "tool_use", name, input }] } });

const WORKFLOW_SKILL = `---
name: cruze-architect
description: Designs the architecture.
---

1. Read \`.agents/skills/cruze-hexagonal-design/SKILL.md\` and \`.agents/skills/cruze-grilling/SKILL.md\`.
2. For each port, read \`.agents/skills/cruze-hexagonal-design/contracts.md\`.
3. Before adopting anything, follow \`.agents/skills/cruze-research/SKILL.md\`.
`;

describe("the load check for a workflow skill", () => {
  it("passes when a run loaded every named knowledge file, by read, shell or skill invocation", () => {
    const transcript = [
      toolUse("Read", { file_path: "/work/fixture/.agents/skills/cruze-hexagonal-design/SKILL.md" }),
      toolUse("Bash", { command: "sed -n 1,80p .claude/skills/cruze-hexagonal-design/contracts.md" }),
      toolUse("Skill", { skill: "cruze-grilling" }),
      JSON.stringify({ type: "user", message: { content: [{ type: "tool_result", content: ".agents/skills/cruze-research/SKILL.md" }] } }),
      "not json",
      toolUse("Read", { file_path: ".agents/skills/cruze-research/SKILL.md" }),
    ].join("\n");
    const report = loadReport(WORKFLOW_SKILL, skillFilesRead(transcript));
    assert.deepEqual(report, {
      named: ["cruze-hexagonal-design/SKILL.md", "cruze-grilling/SKILL.md", "cruze-hexagonal-design/contracts.md", "cruze-research/SKILL.md"],
      missing: [],
      passed: true,
    });
  });

  it("names each knowledge file the run never loaded, ignoring mentions that aren't reads", () => {
    const transcript = [
      toolUse("Read", { file_path: ".agents/skills/cruze-hexagonal-design/SKILL.md" }),
      toolUse("Grep", { pattern: "Operations", path: ".agents/skills/cruze-hexagonal-design/contracts.md" }),
      JSON.stringify({ type: "user", message: { content: [{ type: "tool_result", content: ".agents/skills/cruze-grilling/SKILL.md" }] } }),
    ].join("\n");
    const report = loadReport(WORKFLOW_SKILL, skillFilesRead(transcript));
    assert.deepEqual(report.missing, ["cruze-grilling/SKILL.md", "cruze-hexagonal-design/contracts.md", "cruze-research/SKILL.md"]);
    assert.equal(report.passed, false);
  });
});
