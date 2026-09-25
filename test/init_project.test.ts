import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { initProject } from "../src/app/use_cases/init_project.ts";
import { CruzeError } from "../src/domain/cruze_error.ts";
import { FakeBundle, ScriptedPrompter } from "./fakes/fake_bundle.ts";
import { MemoryProjectFiles } from "./fakes/memory_project_files.ts";

const STARTING_FILES = ["README.md", "CHANGELOG.md", "AGENTS.md", "CLAUDE.md", ".cruze/config.yaml", ".github/workflows/ci.yml", ".gitattributes"];

function setup(initial: Record<string, string> = {}, reply?: string) {
  const files = new MemoryProjectFiles(initial);
  const bundle = new FakeBundle({
    templates: { "init/README.md": "# {{project_name}}\n", "init/config.yaml": "project: {{project_name_quoted}}\n" },
  });
  const prompter = new ScriptedPrompter(reply);
  return { files, prompter, deps: { files, bundle, prompter } };
}

describe("initializing a project", () => {
  it("creates the starting files, titled with the project name, and installs the skills for Claude Code", async () => {
    const { files, deps } = setup();
    const report = await initProject(deps, { name: "Console Access", defaultName: "dir", agents: [] });

    assert.deepEqual(report.created, STARTING_FILES);
    assert.equal(files.files.get("README.md"), "# Console Access\n");
    assert.equal(files.files.get(".cruze/config.yaml"), 'project: "Console Access"\n');
    assert.deepEqual(report.skills.installed, ["cruze-plan", "cruze-build"]);
    assert.deepEqual(report.skills.linked, [{ agent: "claude", dir: ".claude/skills" }]);
  });

  it("leaves existing files untouched and reports them as skipped", async () => {
    const { files, deps } = setup({ "README.md": "# Legacy router\n", "AGENTS.md": "house rules\n" });
    const report = await initProject(deps, { name: "Router", defaultName: "dir", agents: [] });

    assert.deepEqual(report.skipped, ["README.md", "AGENTS.md"]);
    assert.equal(files.files.get("README.md"), "# Legacy router\n");
    assert.equal(files.files.get("AGENTS.md"), "house rules\n");
    assert.ok(report.created.includes("CHANGELOG.md"));
  });

  it("asks for the project name, offering the directory name, when none is given", async () => {
    const { files, prompter, deps } = setup({}, "");
    const report = await initProject(deps, { defaultName: "console-access", agents: [] });

    assert.deepEqual(prompter.questions, [{ question: "Project name", fallback: "console-access" }]);
    assert.equal(report.project, "console-access");
    assert.equal(files.files.get("README.md"), "# console-access\n");
  });

  it("rejects a blank project name before writing anything", async () => {
    const { files, deps } = setup();
    await assert.rejects(
      initProject(deps, { name: "   ", defaultName: "dir", agents: [] }),
      (error: unknown) => error instanceof CruzeError && error.code === "invalid-project-name",
    );
    assert.equal(files.files.size, 0);
  });
});
