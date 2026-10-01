import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { refuseUnknownOptions } from "../src/adapters/inbound/cli/command_options.ts";
import { COMMANDS } from "../src/adapters/inbound/cli/commands.ts";
import { PackageBundle } from "../src/adapters/outbound/package_bundle.ts";

const TEMPLATES = fileURLToPath(new URL("../templates/", import.meta.url));

/** Every `cruze ...` command line a document spells out, up to a pipe or the end of its code span. */
function commandLines(text: string): string[] {
  return [...text.matchAll(/(?:^|`|\$ )cruze ([^`\n|&]*)/gm)].map((m) => (m[1] ?? "").trim());
}

/** Why a command line would fail, or nothing when the CLI takes it. */
function problemOf(line: string): string | undefined {
  const words = line.split(/\s+/);
  const [name = "", sub] = words;
  if (name.startsWith("-") || name === "help" || name === "<command>") return undefined;
  const command = COMMANDS[name];
  if (command === undefined) return `there is no command ${name}`;
  const given = words.filter((w) => w.startsWith("--")).map((w) => w.slice(2).split("=")[0] ?? "");
  try {
    refuseUnknownOptions(name, sub === undefined || sub.startsWith("-") ? [] : [sub], command, given);
    return undefined;
  } catch (error) {
    return (error as Error).message;
  }
}

// A skill written against a newer CLI passed journal list an --item it ignored, and got every entry.
describe("the command lines the shipped skills and templates spell out", () => {
  it("name real commands, with only the options each takes", async () => {
    const skills = (await (await PackageBundle.locate()).skills()).flatMap((skill) => skill.files.map((f) => ({ path: `skills/${skill.folder}/${f.path}`, text: f.text })));
    const templates = readdirSync(TEMPLATES, { recursive: true, withFileTypes: true })
      .filter((entry) => entry.isFile())
      .map((entry) => { const path = join(entry.parentPath, entry.name); return { path, text: readFileSync(path, "utf8") }; });
    const lines = [...skills, ...templates].flatMap((file) => commandLines(file.text).map((line) => ({ path: file.path, line })));
    assert.ok(lines.length > 50, `found only ${lines.length} command lines`);
    const problems = lines.flatMap(({ path, line }) => { const problem = problemOf(line); return problem === undefined ? [] : [`${path}: cruze ${line}: ${problem}`]; });
    assert.deepEqual(problems, []);
  });

  it("are checked by a rule that refuses an option on the wrong command or subcommand", () => {
    assert.match(problemOf("validate --item x") ?? "", /cruze validate doesn't take --item; it takes no options/);
    assert.match(problemOf("journal list --change x") ?? "", /cruze journal list doesn't take --change; it takes --event, --item/);
    assert.equal(problemOf("journal list --event disposition --item x --json"), undefined);
    assert.equal(problemOf("journal <add|list>"), undefined);
  });
});
