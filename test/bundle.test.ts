import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { PackageBundle } from "../src/adapters/outbound/package_bundle.ts";
import { INIT_SCAFFOLD, renderTemplate } from "../src/domain/scaffold.ts";
import { SKILL_FILE, skillProblems } from "../src/domain/skill.ts";
import { skillLinkProblems, type SkillFiles } from "../src/domain/skill_links.ts";

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

  it("has a template for every starting file, with no unfilled placeholders", async () => {
    const bundle = await PackageBundle.locate();
    const values = { project_name: "Demo", project_name_quoted: '"Demo"', cruze_version: bundle.version };
    for (const entry of INIT_SCAFFOLD) {
      const rendered = renderTemplate(await bundle.template(entry.template), values);
      assert.doesNotMatch(rendered, /\{\{/, `${entry.template} has an unfilled placeholder`);
    }
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
