import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { initProject } from "../src/app/use_cases/init_project.ts";
import { CruzeError } from "../src/domain/cruze_error.ts";
import { FakeBundle, ScriptedPrompter } from "./fakes/fake_bundle.ts";
import { MemoryProjectFiles } from "./fakes/memory_project_files.ts";

const STARTING_FILES = ["README.md", "CHANGELOG.md", "AGENTS.md", ".cruze/config.yaml", ".github/workflows/ci.yml", ".gitattributes"];

function setup(initial: Record<string, string> = {}, ...replies: string[]) {
  const files = new MemoryProjectFiles(initial);
  const bundle = new FakeBundle({
    templates: {
      "init/README.md": "# {{project_name}}\n",
      "init/config.yaml": "project: {{project_name_quoted}}\n{{review_setting}}\n",
      "init/review/claude.yaml": "review: claude\n",
      "init/review/other.yaml": "# review: none\n",
    },
  });
  const prompter = new ScriptedPrompter(...replies);
  return { files, prompter, deps: { files, bundle, prompter } };
}

describe("initializing a project", () => {
  it("creates the starting files, titled with the project name, and sets up Claude Code by default", async () => {
    const { files, prompter, deps } = setup();
    const report = await initProject(deps, { name: "Console Access", defaultName: "dir", agents: [] });

    assert.deepEqual(prompter.questions, [{ question: "Coding agent (claude or other)", fallback: "claude" }]);
    assert.equal(report.agent, "claude");
    assert.deepEqual(report.created, [...STARTING_FILES, "CLAUDE.md"]);
    assert.equal(files.links.get("CLAUDE.md"), "AGENTS.md");
    assert.equal(files.files.get("README.md"), "# Console Access\n");
    assert.equal(files.files.get(".cruze/config.yaml"), 'cruze: "9.9.9"\nproject: "Console Access"\nreview: claude\n');
    assert.deepEqual(report.skills.installed, ["cruze-plan", "cruze-build"]);
    assert.deepEqual(report.skills.linked, [{ agent: "claude", dir: ".claude/skills" }]);
  });

  // A project on OpenCode got CLAUDE.md, Claude Code's skill links, and reviews that ran claude.
  it("sets up another agent with AGENTS.md and the shared skills only, leaving reviews to its own helpers", async () => {
    const { files, deps } = setup({}, "other");
    const report = await initProject(deps, { name: "Console Access", defaultName: "dir", agents: [] });

    assert.equal(report.agent, "other");
    assert.deepEqual(report.created, STARTING_FILES);
    assert.equal(await files.exists("CLAUDE.md"), false);
    assert.equal(files.files.get(".cruze/config.yaml"), 'cruze: "9.9.9"\nproject: "Console Access"\n# review: none\n');
    assert.deepEqual(report.skills.linked, []);
  });

  it("doesn't ask for the agent when --agent names it or the repository already uses Claude Code", async () => {
    const named = setup();
    assert.equal((await initProject(named.deps, { name: "A", defaultName: "dir", agents: ["other"] })).agent, "other");
    const claudeRepo = setup({ "CLAUDE.md": "house rules\n" });
    const report = await initProject(claudeRepo.deps, { name: "A", defaultName: "dir", agents: [] });
    assert.equal(report.agent, "claude");
    assert.ok(report.skipped.includes("CLAUDE.md"));
    assert.equal(claudeRepo.files.files.get("CLAUDE.md"), "house rules\n");
    assert.deepEqual([...named.prompter.questions, ...claudeRepo.prompter.questions], []);
  });

  it("refuses an agent it doesn't know before writing anything", async () => {
    const { files, deps } = setup({}, "cursor");
    await assert.rejects(
      initProject(deps, { name: "A", defaultName: "dir", agents: [] }),
      (error: unknown) => error instanceof CruzeError && error.code === "unknown-agent",
    );
    assert.equal(files.files.size, 0);
  });

  it("runs the published package in CI by default, or the source Cruze was installed from", async () => {
    const template = { "init/ci.yml": "run: npx --yes --package={{cruze_package}} cruze validate\n" };
    const published = setup();
    const bundle = new FakeBundle({ templates: template });
    await initProject({ ...published.deps, bundle }, { name: "A", defaultName: "dir", agents: [] });
    assert.equal(published.files.files.get(".github/workflows/ci.yml"), "run: npx --yes --package=@printpractical/cruze@9.9.9 cruze validate\n");

    const fromGit = setup();
    await initProject({ ...fromGit.deps, bundle }, { name: "A", defaultName: "dir", agents: [], package: "github:PrintPractical/cruze#v9.9.9" });
    assert.equal(fromGit.files.files.get(".github/workflows/ci.yml"), "run: npx --yes --package=github:PrintPractical/cruze#v9.9.9 cruze validate\n");
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
    const report = await initProject(deps, { defaultName: "console-access", agents: ["claude"] });

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
