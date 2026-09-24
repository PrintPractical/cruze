import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { installSkills } from "../src/app/use_cases/install_skills.ts";
import { CruzeError } from "../src/domain/cruze_error.ts";
import { FakeBundle, skillFixture } from "./fakes/fake_bundle.ts";
import { MemoryProjectFiles } from "./fakes/memory_project_files.ts";

describe("installing skills", () => {
  it("writes every bundled skill, with all its files, under the cruze- prefix in .agents/skills", async () => {
    const files = new MemoryProjectFiles();
    const report = await installSkills({ files, bundle: new FakeBundle() }, { agents: [] });

    assert.deepEqual(report.installed, ["cruze-plan", "cruze-build"]);
    assert.match(files.files.get(".agents/skills/cruze-plan/SKILL.md") ?? "", /name: cruze-plan/);
    assert.equal(files.files.get(".agents/skills/cruze-build/reference/notes.md"), "Notes for build.\n");
  });

  it("links the skills for Claude Code when the project has a CLAUDE.md", async () => {
    const files = new MemoryProjectFiles({ "CLAUDE.md": "@AGENTS.md\n" });
    const report = await installSkills({ files, bundle: new FakeBundle() }, { agents: [] });

    assert.deepEqual(report.linked, [{ agent: "claude", dir: ".claude/skills" }]);
    assert.equal(files.links.get(".claude/skills/cruze-plan"), "../../.agents/skills/cruze-plan");
    assert.match(files.readThroughLink(".claude/skills/cruze-plan", "SKILL.md") ?? "", /name: cruze-plan/);
  });

  it("links nothing when the project shows no agent and none is requested", async () => {
    const files = new MemoryProjectFiles();
    const report = await installSkills({ files, bundle: new FakeBundle() }, { agents: [] });

    assert.deepEqual(report.linked, []);
    assert.equal(files.links.size, 0);
  });

  it("links for a requested agent even without a marker file", async () => {
    const files = new MemoryProjectFiles();
    await installSkills({ files, bundle: new FakeBundle() }, { agents: ["claude"] });

    assert.equal(files.links.get(".claude/skills/cruze-build"), "../../.agents/skills/cruze-build");
  });

  it("rejects an agent it does not know", async () => {
    const files = new MemoryProjectFiles();
    await assert.rejects(
      installSkills({ files, bundle: new FakeBundle() }, { agents: ["gemini"] }),
      (error: unknown) => error instanceof CruzeError && error.code === "unknown-agent",
    );
  });

  it("removes Cruze skills the package no longer ships and leaves the user's own skills alone", async () => {
    const files = new MemoryProjectFiles({
      "CLAUDE.md": "",
      ".agents/skills/cruze-retired/SKILL.md": "old",
      ".agents/skills/my-skill/SKILL.md": "mine",
      ".claude/skills/my-claude-skill/SKILL.md": "mine too",
    });
    await files.link(".claude/skills/cruze-retired", "../../.agents/skills/cruze-retired");

    const report = await installSkills({ files, bundle: new FakeBundle() }, { agents: [] });

    assert.deepEqual(report.removed, ["cruze-retired"]);
    assert.equal(await files.exists(".agents/skills/cruze-retired"), false);
    assert.equal(files.links.has(".claude/skills/cruze-retired"), false);
    assert.equal(files.files.get(".agents/skills/my-skill/SKILL.md"), "mine");
    assert.equal(files.files.get(".claude/skills/my-claude-skill/SKILL.md"), "mine too");
  });

  it("replaces an installed skill's files instead of merging with old ones", async () => {
    const files = new MemoryProjectFiles({ ".agents/skills/cruze-plan/obsolete.md": "stale" });
    await installSkills({ files, bundle: new FakeBundle() }, { agents: [] });

    assert.equal(files.files.has(".agents/skills/cruze-plan/obsolete.md"), false);
  });

  it("refuses a bundle with an invalid skill and writes nothing", async () => {
    const files = new MemoryProjectFiles();
    const bundle = new FakeBundle({ skills: [skillFixture("plan"), skillFixture("build", "build")] });

    await assert.rejects(
      installSkills({ files, bundle }, { agents: [] }),
      (error: unknown) => error instanceof CruzeError && /build: name is "build", expected "cruze-build"/.test(error.message),
    );
    assert.equal(files.files.size, 0);
  });
});
