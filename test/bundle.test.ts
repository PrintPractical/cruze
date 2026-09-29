import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { PackageBundle } from "../src/adapters/outbound/package_bundle.ts";
import { parseConfig } from "../src/domain/config.ts";
import { INIT_AGENTS, INIT_SCAFFOLD, renderTemplate, reviewSettingTemplate } from "../src/domain/scaffold.ts";
import { SKILL_FILE, agentToolProblems, skillProblems } from "../src/domain/skill.ts";
import { skillLinkProblems, type SkillFiles } from "../src/domain/skill_links.ts";
import { compareVersions } from "../src/domain/versions/cruze_version.ts";
import { parseRealignNotes, type RealignNote } from "../src/domain/versions/realign_notes.ts";
import { RULE_SINCE } from "../src/domain/versions/rule_versions.ts";

// Lints the real package contents: what `npm publish` would ship.
describe("the shipped bundle", () => {
  it("contains only valid skills", async () => {
    const bundle = await PackageBundle.locate();
    const skills = await bundle.skills();
    assert.ok(skills.length > 0, "the bundle ships no skills");

    const problems = skills.flatMap((skill) => {
      const skillFile = skill.files.find((file) => file.path === SKILL_FILE);
      return skillFile === undefined ? [`${skill.folder}: ${SKILL_FILE} is missing`] : skillProblems(skill.folder, skillFile.text);
    });
    assert.deepEqual(problems, []);
  });

  it("resolves every pointer between skill files, and reaches every file from its SKILL.md", async () => {
    const bundle = await PackageBundle.locate();
    assert.deepEqual(skillLinkProblems(await bundle.skills()), []);
  });

  it("names no agent-specific tool, so every agent can follow the skills", async () => {
    const bundle = await PackageBundle.locate();
    const problems = (await bundle.skills()).flatMap((skill) =>
      skill.files.filter((f) => f.path.endsWith(".md")).flatMap((f) => agentToolProblems(`${skill.folder}/${f.path}`, f.text)),
    );
    assert.deepEqual(problems, []);
  });

  it("has a template for every starting file, with no unfilled placeholders", async () => {
    const bundle = await PackageBundle.locate();
    for (const agent of INIT_AGENTS) {
      const review_setting = await bundle.template(reviewSettingTemplate(agent));
      const values = { project_name: "Demo", project_name_quoted: '"Demo"', cruze_version: bundle.version, cruze_package: `@printpractical/cruze@${bundle.version}`, review_setting };
      for (const entry of INIT_SCAFFOLD) {
        const rendered = renderTemplate(await bundle.template(entry.template), values);
        assert.doesNotMatch(rendered, /\{\{/, `${entry.template} has an unfilled placeholder`);
        if (entry.path !== ".cruze/config.yaml") continue;
        const parsed = parseConfig(rendered);
        assert.deepEqual(parsed.problems, [], `the config for ${agent} is invalid`);
        assert.equal(parsed.config?.review.command?.[0], agent === "claude" ? "claude" : undefined);
      }
    }
  });
});

// Realign brings existing projects up to each release, so a release must say what it expects of them.
describe("the realign notes", () => {
  const notesOf = async (): Promise<{ notes: RealignNote[]; problems: string[]; versions: string[] }> => {
    const skill = (await (await PackageBundle.locate()).skills()).find((s) => s.folder === "realign");
    const files = (skill?.files ?? []).filter((f) => f.path.startsWith("notes/"));
    const parsed = files.map((f) => ({ version: /^notes\/(.+)\.md$/.exec(f.path)?.[1] ?? "", text: f.text }));
    const results = parsed.map((p) => parseRealignNotes(p.version, p.text));
    const badNames = parsed.filter((p) => !/^\d+\.\d+\.\d+$/.test(p.version)).map((p) => `notes/${p.version}.md is not named for a version`);
    return { notes: results.flatMap((r) => r.notes), problems: [...badNames, ...results.flatMap((r) => r.problems)], versions: parsed.map((p) => p.version) };
  };

  it("are well formed", async () => {
    assert.deepEqual((await notesOf()).problems, []);
  });

  it("give every rule that reports on existing code a note in the release that introduced it", async () => {
    const { notes } = await notesOf();
    const missing = Object.entries(RULE_SINCE).filter(([key, since]) => !notes.some((n) => n.detect === key && n.version === since)).map(([key, since]) => `${key} has no note in notes/${since}.md`);
    const unknown = notes.filter((n) => n.detect !== undefined && RULE_SINCE[n.detect] === undefined).map((n) => `${n.version} ${n.id} detects ${n.detect}, which RULE_SINCE doesn't list`);
    assert.deepEqual([...missing, ...unknown], []);
  });

  it("include a notes file for the coming release whenever the changelog has unreleased changes", async () => {
    const bundle = await PackageBundle.locate();
    const changelog = readFileSync(fileURLToPath(new URL("../CHANGELOG.md", import.meta.url)), "utf8");
    const unreleased = changelog.slice(changelog.indexOf("## [Unreleased]"), changelog.indexOf("\n## [", changelog.indexOf("## [Unreleased]") + 1));
    if (!/^- /m.test(unreleased)) return;
    const { versions } = await notesOf();
    assert.ok(
      versions.some((v) => compareVersions(v, bundle.version) > 0),
      `the changelog has unreleased changes, so add skills/realign/notes/<next version>.md, newer than ${bundle.version}`,
    );
  });
});

describe("checking pointers between skill files", () => {
  const skill = (folder: string, files: Record<string, string>): SkillFiles => ({
    folder,
    files: Object.entries(files).map(([path, text]) => ({ path, text })),
  });

  it("reports a missing sibling, a link out of the skill, a missing installed path and an unreachable file", () => {
    const problems = skillLinkProblems([
      skill("testing", {
        "SKILL.md": "Read [fakes.md](fakes.md) and [plan](../plan/SKILL.md), then `.agents/skills/cruze-formats/reference/specs.md`.",
        "examples.md": "Nothing links here.",
      }),
      skill("formats", { "SKILL.md": "See [the specs reference](reference/specs.md#scenarios)." }),
    ]);
    assert.deepEqual(problems, [
      "testing/SKILL.md: link fakes.md points to a missing file",
      "testing/SKILL.md: link ../plan/SKILL.md leaves the skill; name another skill by its installed path",
      "testing/SKILL.md: .agents/skills/cruze-formats/reference/specs.md is not in the bundle",
      "testing/examples.md: no link reaches it from SKILL.md",
      "formats/SKILL.md: link reference/specs.md points to a missing file",
    ]);
  });

  it("follows links transitively and ignores links inside code fences", () => {
    const problems = skillLinkProblems([
      skill("formats", {
        "SKILL.md": "Read [reference/specs.md](reference/specs.md).\n```markdown\n[not a pointer](nowhere.md)\n```",
        "reference/specs.md": "Template: [../templates/spec.md](../templates/spec.md).",
        "templates/spec.md": "# Spec",
      }),
    ]);
    assert.deepEqual(problems, []);
  });
});

describe("checking skills for agent-specific tools", () => {
  it("flags tool-shaped names, and leaves verbs and code examples alone", () => {
    const text = [
      "1. Read `docs/architecture.md`, then edit the plan.",
      "2. Use the Bash tool to run the tests.",
      "3. Track the steps with TodoWrite.",
      "4. Ask with `Agent` for a helper.",
      "```yaml",
      'command: ["claude", "-p", "--allowedTools", "Bash(git diff:*)"]',
      "```",
    ].join("\n");
    assert.deepEqual(agentToolProblems("plan/SKILL.md", text), [
      "plan/SKILL.md:2: names a named tool; describe the action instead",
      "plan/SKILL.md:3: names a Claude Code tool name; describe the action instead",
      "plan/SKILL.md:4: names a tool name in backticks; describe the action instead",
    ]);
  });
});

// Maintainer skills live in this repository's own .agents/skills/, are not shipped, and follow the same rules.
describe("the maintainer skills", () => {
  it("are valid skills whose pointers resolve and that name no agent-specific tool", () => {
    const root = fileURLToPath(new URL("../.agents/skills/", import.meta.url));
    const skills = readdirSync(root, { withFileTypes: true }).filter((e) => e.isDirectory()).map((dir) => ({
      folder: dir.name.replace(/^cruze-/, ""),
      files: readdirSync(`${root}${dir.name}`).filter((f) => f.endsWith(".md")).map((f) => ({ path: f, text: readFileSync(`${root}${dir.name}/${f}`, "utf8") })),
    }));
    assert.ok(skills.some((skill) => skill.folder === "retro"));
    const problems = skills.flatMap((skill) => [
      ...skillProblems(skill.folder, skill.files.find((f) => f.path === SKILL_FILE)?.text ?? ""),
      ...skill.files.flatMap((f) => agentToolProblems(`${skill.folder}/${f.path}`, f.text)),
    ]);
    assert.deepEqual([...problems, ...skillLinkProblems(skills)], []);
  });
});
