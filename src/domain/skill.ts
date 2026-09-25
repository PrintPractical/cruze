/**
 * Rules for bundled skills in the Agent Skills format: a folder holding a SKILL.md
 * whose frontmatter carries `name` and `description`, installed as `cruze-<folder>`.
 */

export const SKILL_FILE = "SKILL.md";
export const SKILL_PREFIX = "cruze-";
export const MAX_BODY_LINES = 150;

const MAX_NAME_LENGTH = 64;
const MAX_DESCRIPTION_LENGTH = 1024;
const NAME_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export interface SkillDocument {
  frontmatter: Record<string, string>;
  body: string;
}

/** The directory name a bundled skill folder gets once installed into a project. */
export function installedSkillName(folder: string): string {
  return `${SKILL_PREFIX}${folder}`;
}

export function isInstalledSkillName(name: string): boolean {
  return name.startsWith(SKILL_PREFIX);
}

/**
 * Splits a SKILL.md into frontmatter and body. Frontmatter is read as flat
 * `key: value` lines, which is all Cruze's own skills use; returns null when
 * the file has no frontmatter block.
 */
export function parseSkillDocument(text: string): SkillDocument | null {
  const lines = text.split(/\r?\n/);
  if (lines[0] !== "---") return null;
  const end = lines.indexOf("---", 1);
  if (end === -1) return null;

  const frontmatter: Record<string, string> = {};
  for (const line of lines.slice(1, end)) {
    const match = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line);
    if (match?.[1] !== undefined && match[2] !== undefined) {
      frontmatter[match[1]] = unquote(match[2].trim());
    }
  }
  return { frontmatter, body: lines.slice(end + 1).join("\n") };
}

/** Every rule a bundled skill breaks; empty when the skill is valid. */
export function skillProblems(folder: string, skillText: string): string[] {
  const doc = parseSkillDocument(skillText);
  if (doc === null) return [`${folder}: ${SKILL_FILE} has no frontmatter block`];

  const problems: string[] = [];
  const expectedName = installedSkillName(folder);
  const name = doc.frontmatter["name"] ?? "";
  const description = doc.frontmatter["description"] ?? "";

  if (name !== expectedName) {
    problems.push(`${folder}: name is "${name}", expected "${expectedName}"`);
  }
  if (name.length > MAX_NAME_LENGTH || !NAME_PATTERN.test(name)) {
    problems.push(`${folder}: name must be lowercase letters, digits and single hyphens, at most ${MAX_NAME_LENGTH} characters`);
  }
  if (description.length === 0) {
    problems.push(`${folder}: description is missing`);
  }
  if (description.length > MAX_DESCRIPTION_LENGTH) {
    problems.push(`${folder}: description is longer than ${MAX_DESCRIPTION_LENGTH} characters`);
  }
  const bodyLines = doc.body.trimEnd().split("\n").length;
  if (bodyLines > MAX_BODY_LINES) {
    problems.push(`${folder}: body is ${bodyLines} lines, the limit is ${MAX_BODY_LINES}; move reference material to sibling files`);
  }
  return problems;
}

function unquote(value: string): string {
  const quoted = /^"(.*)"$/.exec(value) ?? /^'(.*)'$/.exec(value);
  return quoted?.[1] ?? value;
}

/**
 * Agent-specific tool names a skill must not use, because skills run under any agent. Plain
 * verbs such as "Read" or "Edit" are fine; these patterns catch tool-shaped uses only.
 */
const AGENT_TOOL_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /\b(TodoWrite|WebFetch|WebSearch|AskUserQuestion|NotebookEdit|MultiEdit|ExitPlanMode|SlashCommand|subagent_type)\b/, label: "a Claude Code tool name" },
  { pattern: /`(Read|Write|Edit|Bash|Grep|Glob|Task|Agent|Skill|LS)`/, label: "a tool name in backticks" },
  { pattern: /\b(Read|Write|Edit|Bash|Grep|Glob|Task|Agent|Skill)\s+tool\b/, label: "a named tool" },
  { pattern: /\b(Bash|Read|Write|Edit|WebFetch)\([^)]*\)/, label: "a tool permission pattern" },
];

/**
 * Lines of a skill file that name an agent-specific tool. Fenced code blocks are skipped: they
 * hold data such as a config example, which may be written for one agent.
 */
export function agentToolProblems(where: string, text: string): string[] {
  let inFence = false;
  return text.split("\n").flatMap((line, i) => {
    if (/^\s*(```|~~~)/.test(line)) inFence = !inFence;
    if (inFence) return [];
    const hit = AGENT_TOOL_PATTERNS.find(({ pattern }) => pattern.test(line));
    return hit === undefined ? [] : [`${where}:${i + 1}: names ${hit.label}; describe the action instead`];
  });
}
