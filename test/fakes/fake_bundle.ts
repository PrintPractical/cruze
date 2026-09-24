import { readFileSync } from "node:fs";
import type { Bundle, BundledSkill } from "../../src/app/ports/bundle.ts";
import type { Prompter } from "../../src/app/ports/prompter.ts";

export function skillFixture(folder: string, name = `cruze-${folder}`): BundledSkill {
  return {
    folder,
    files: [
      { path: "SKILL.md", text: `---\nname: ${name}\ndescription: Does ${folder}. Use when testing.\n---\n\nBody.\n` },
      { path: "reference/notes.md", text: `Notes for ${folder}.\n` },
    ],
  };
}

export class FakeBundle implements Bundle {
  readonly version: string;
  private readonly bundledSkills: BundledSkill[];
  private readonly templates: Record<string, string>;

  constructor(options: { skills?: BundledSkill[]; templates?: Record<string, string>; version?: string } = {}) {
    this.bundledSkills = options.skills ?? [skillFixture("plan"), skillFixture("build")];
    this.templates = options.templates ?? {};
    this.version = options.version ?? "9.9.9";
  }

  async skills(): Promise<BundledSkill[]> {
    return this.bundledSkills;
  }

  async template(path: string): Promise<string> {
    return this.templates[path] ?? `template ${path} for {{project_name}}\n`;
  }

  async formatTemplate(name: string): Promise<string> {
    return readFileSync(new URL(`../../skills/formats/templates/${name}`, import.meta.url), "utf8");
  }
}

/** Answers every question with a fixed reply, recording what was asked. */
export class ScriptedPrompter implements Prompter {
  readonly questions: Array<{ question: string; fallback: string }> = [];
  private readonly reply: string | undefined;

  constructor(reply?: string) {
    this.reply = reply;
  }

  async ask(question: string, fallback: string): Promise<string> {
    this.questions.push({ question, fallback });
    return this.reply === undefined || this.reply.trim() === "" ? fallback : this.reply;
  }
}
