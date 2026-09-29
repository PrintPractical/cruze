import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { installSkills } from "../src/app/use_cases/install_skills.ts";
import { validate } from "../src/app/use_cases/validate_project.ts";
import { CruzeError } from "../src/domain/cruze_error.ts";
import { FakeBundle } from "./fakes/fake_bundle.ts";
import { MemoryProjectFiles } from "./fakes/memory_project_files.ts";
import { exampleProject, setVersions } from "./support/harness.ts";

const CONFIG = `# Cruze project configuration, created by cruze 0.0.1.
version: 1
cruze: "0.0.1"
project: "Console Access"
`;

const ci = (spec: string): string => `      - name: Documents match the Cruze formats\n        run: npx --yes --package=${spec} cruze validate\n        run: npx --yes --package=${spec} cruze check --ci\n`;

describe("upgrading a project to a new Cruze", () => {
  it("records the installed version in the config, keeping its comments, and reports where it came from", async () => {
    const files = new MemoryProjectFiles({ ".cruze/config.yaml": CONFIG });
    const report = await installSkills({ files, bundle: new FakeBundle({ version: "0.0.2" }) }, { agents: [] });
    assert.equal(files.files.get(".cruze/config.yaml"), CONFIG.replace('cruze: "0.0.1"', 'cruze: "0.0.2"'));
    assert.deepEqual([report.recorded.from, report.recorded.to], ["0.0.1", "0.0.2"]);
  });

  it("adds the version to a project that never recorded one, after its format version", async () => {
    const files = new MemoryProjectFiles({ ".cruze/config.yaml": CONFIG.replace('cruze: "0.0.1"\n', "") });
    await installSkills({ files, bundle: new FakeBundle({ version: "0.0.2" }) }, { agents: [] });
    assert.match(files.files.get(".cruze/config.yaml") ?? "", /^version: 1\ncruze: "0\.0\.2"\nproject:/m);
  });

  it("moves CI to the new version, whether it runs the npm package, the release tarball or a release tag", async () => {
    const specs = [
      ["@printpractical/cruze@0.0.1", "@printpractical/cruze@0.0.2"],
      ["https://github.com/PrintPractical/cruze/releases/download/v0.0.1/printpractical-cruze-0.0.1.tgz", "https://github.com/PrintPractical/cruze/releases/download/v0.0.2/printpractical-cruze-0.0.2.tgz"],
      ["github:PrintPractical/cruze#v0.0.1", "github:PrintPractical/cruze#v0.0.2"],
    ];
    for (const [before, after] of specs) {
      const files = new MemoryProjectFiles({ ".cruze/config.yaml": CONFIG, ".github/workflows/ci.yml": ci(before ?? "") });
      const report = await installSkills({ files, bundle: new FakeBundle({ version: "0.0.2" }) }, { agents: [] });
      assert.equal(files.files.get(".github/workflows/ci.yml"), ci(after ?? ""));
      assert.deepEqual(report.recorded.ci, { repinned: [after], unrecognised: [] });
    }
  });

  it("leaves a CI spec it can't move, such as a branch, and says so", async () => {
    const files = new MemoryProjectFiles({ ".cruze/config.yaml": CONFIG, ".github/workflows/ci.yml": ci("github:PrintPractical/cruze#main") });
    const report = await installSkills({ files, bundle: new FakeBundle({ version: "0.0.2" }) }, { agents: [] });
    assert.equal(files.files.get(".github/workflows/ci.yml"), ci("github:PrintPractical/cruze#main"));
    assert.deepEqual(report.recorded.ci, { repinned: [], unrecognised: ["github:PrintPractical/cruze#main"] });
  });

  it("refuses to install an older Cruze's skills over a newer project, and writes nothing", async () => {
    const files = new MemoryProjectFiles({ ".cruze/config.yaml": CONFIG.replace('"0.0.1"', '"0.1.0"'), ".github/workflows/ci.yml": ci("@printpractical/cruze@0.1.0") });
    const before = new Map(files.files);
    await assert.rejects(
      installSkills({ files, bundle: new FakeBundle({ version: "0.0.2" }) }, { agents: [] }),
      (e: unknown) => e instanceof CruzeError && e.code === "older-cli" && /uses Cruze 0\.1\.0, and this CLI is 0\.0\.2/.test(e.message),
    );
    assert.deepEqual(files.files, before);
  });

  it("warns in validate when the project's skills don't match this CLI, and says what to run", async () => {
    const h = await exampleProject();
    const cli = h.deps.bundle.version;
    const skew = async (): Promise<string[]> => (await validate(h.deps)).problems.filter((p) => p.rule === "cruze-version").map((p) => `${p.severity}: ${p.message}`);
    setVersions(h.files, { cruze: cli });
    assert.deepEqual(await skew(), []);
    setVersions(h.files, { cruze: "0.0.0" });
    assert.match((await skew())[0] ?? "", new RegExp(`^warning: the project's skills are from Cruze 0\\.0\\.0, older than this CLI \\(${cli.replaceAll(".", "\\.")}\\); run \`cruze install\``));
    setVersions(h.files, { cruze: "99.0.0" });
    assert.match((await skew())[0] ?? "", /newer than this CLI .*; upgrade the CLI/);
    setVersions(h.files, { cruze: null });
    assert.match((await skew())[0] ?? "", /doesn't record which Cruze its skills came from; run `cruze install`/);
  });
});
