import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { PackageBundle } from "../src/adapters/outbound/package_bundle.ts";
import { INIT_SCAFFOLD, renderTemplate } from "../src/domain/scaffold.ts";
import { SKILL_FILE, skillProblems } from "../src/domain/skill.ts";

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

  it("has a template for every starting file, with no unfilled placeholders", async () => {
    const bundle = await PackageBundle.locate();
    const values = { project_name: "Demo", project_name_quoted: '"Demo"', cruze_version: bundle.version };
    for (const entry of INIT_SCAFFOLD) {
      const rendered = renderTemplate(await bundle.template(entry.template), values);
      assert.doesNotMatch(rendered, /\{\{/, `${entry.template} has an unfilled placeholder`);
    }
  });
});
