import { posix } from "node:path";
import { SKILL_FILE, SKILL_PREFIX } from "./skill.ts";

/**
 * Pointers between bundled skill files. A skill reaches its own sibling files
 * through relative Markdown links, and other Cruze skills through their
 * installed path, `.agents/skills/cruze-<name>/<file>`.
 */

export interface SkillFiles {
  folder: string;
  files: { path: string; text: string }[];
}

export interface InstalledSkillRef {
  /** The installed skill name, such as `cruze-formats`. */
  skill: string;
  /** The file inside that skill, such as `reference/work-items.md`. */
  path: string;
}

const INSTALLED_REF = /\.agents\/skills\/(cruze-[a-z0-9]+(?:-[a-z0-9]+)*)\/([\w./-]*\w)/g;
const MARKDOWN_LINK = /\]\(([^)\s]+)\)/g;

/** Every file of another Cruze skill that a text names by its installed path, in order, without repeats. */
export function installedSkillRefs(text: string): InstalledSkillRef[] {
  const seen = new Set<string>();
  const refs: InstalledSkillRef[] = [];
  for (const match of text.matchAll(INSTALLED_REF)) {
    const ref = { skill: match[1] ?? "", path: match[2] ?? "" };
    const key = `${ref.skill}/${ref.path}`;
    if (!seen.has(key)) refs.push(ref);
    seen.add(key);
  }
  return refs;
}

/** Targets of the relative Markdown links outside code fences, without any `#fragment`. */
export function relativeLinks(text: string): string[] {
  const targets: string[] = [];
  let inFence = false;
  for (const line of text.split("\n")) {
    if (/^\s*(```|~~~)/.test(line)) inFence = !inFence;
    if (inFence) continue;
    for (const match of line.matchAll(MARKDOWN_LINK)) {
      const target = (match[1] ?? "").split("#")[0] ?? "";
      if (target !== "" && !/^[a-z][a-z0-9+.-]*:/i.test(target)) targets.push(target);
    }
  }
  return targets;
}

/**
 * Every broken pointer in the bundled skills: a link to a missing sibling, a link
 * that leaves its skill, an installed path to a missing file, and a Markdown file
 * that its skill's SKILL.md can't reach through links.
 */
export function skillLinkProblems(skills: SkillFiles[]): string[] {
  const exists = new Set(skills.flatMap((skill) => skill.files.map((file) => `${skill.folder}/${file.path}`)));
  const problems: string[] = [];
  for (const skill of skills) {
    for (const file of skill.files.filter((f) => f.path.endsWith(".md"))) {
      const where = `${skill.folder}/${file.path}`;
      for (const target of relativeLinks(file.text)) {
        const resolved = resolveLink(file.path, target);
        if (resolved === null) problems.push(`${where}: link ${target} leaves the skill; name another skill by its installed path`);
        else if (!exists.has(`${skill.folder}/${resolved}`)) problems.push(`${where}: link ${target} points to a missing file`);
      }
      for (const ref of installedSkillRefs(file.text)) {
        const folder = ref.skill.slice(SKILL_PREFIX.length);
        if (!exists.has(`${folder}/${ref.path}`)) problems.push(`${where}: .agents/skills/${ref.skill}/${ref.path} is not in the bundle`);
      }
    }
    const reachable = reachableFromSkillFile(skill);
    for (const file of skill.files.filter((f) => f.path.endsWith(".md") && !reachable.has(f.path))) {
      problems.push(`${skill.folder}/${file.path}: no link reaches it from ${SKILL_FILE}`);
    }
  }
  return problems;
}

/** A link's path inside the skill folder, or null when it leaves the folder. */
function resolveLink(fromPath: string, target: string): string | null {
  const resolved = posix.normalize(posix.join(posix.dirname(fromPath), target));
  return resolved.startsWith("../") || resolved === ".." ? null : resolved;
}

function reachableFromSkillFile(skill: SkillFiles): Set<string> {
  const texts = new Map(skill.files.map((file) => [file.path, file.text]));
  const reached = new Set<string>();
  const queue = [SKILL_FILE];
  while (queue.length > 0) {
    const path = queue.shift() ?? "";
    const text = texts.get(path);
    if (reached.has(path) || text === undefined) continue;
    reached.add(path);
    for (const target of relativeLinks(text)) {
      const resolved = resolveLink(path, target);
      if (resolved !== null) queue.push(resolved);
    }
  }
  return reached;
}
