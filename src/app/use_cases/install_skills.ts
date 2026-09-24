import { posix } from "node:path";
import { CruzeError } from "../../domain/cruze_error.ts";
import { AGENT_SKILL_HOMES, SHARED_SKILLS_DIR, agentSkillHome, knownAgents } from "../../domain/agent_skill_homes.ts";
import { SKILL_FILE, installedSkillName, isInstalledSkillName, skillProblems } from "../../domain/skill.ts";
import type { Bundle, BundledSkill } from "../ports/bundle.ts";
import type { ProjectFiles } from "../ports/project_files.ts";

export interface InstallSkillsRequest {
  /** Agents to link skills for even when the project shows no sign of using them. */
  agents: string[];
}

export interface InstallSkillsReport {
  version: string;
  installed: string[];
  removed: string[];
  linked: Array<{ agent: string; dir: string }>;
}

/**
 * Replaces the project's Cruze skills with the bundled set. Skills are written to
 * the shared Agent Skills directory, and linked for every agent the project uses.
 * Skills without the Cruze prefix belong to the user and are never touched.
 */
export async function installSkills(
  deps: { files: ProjectFiles; bundle: Bundle },
  request: InstallSkillsRequest,
): Promise<InstallSkillsReport> {
  const { files, bundle } = deps;
  const skills = await bundle.skills();
  assertValid(skills);

  const names = skills.map((skill) => installedSkillName(skill.folder));
  const removed = await removeStaleSkills(files, SHARED_SKILLS_DIR, names);
  for (const skill of skills) {
    await writeSkill(files, skill);
  }

  const linked: InstallSkillsReport["linked"] = [];
  for (const agent of await agentsToLink(files, request.agents)) {
    const home = agentSkillHome(agent);
    if (home === undefined) continue;
    await removeStaleSkills(files, home.skillsDir, []);
    for (const name of names) {
      const linkPath = posix.join(home.skillsDir, name);
      await files.link(linkPath, posix.relative(home.skillsDir, posix.join(SHARED_SKILLS_DIR, name)));
    }
    linked.push({ agent, dir: home.skillsDir });
  }

  return { version: bundle.version, installed: names, removed, linked };
}

function assertValid(skills: BundledSkill[]): void {
  const problems = skills.flatMap((skill) => {
    const skillFile = skill.files.find((file) => file.path === SKILL_FILE);
    return skillFile === undefined ? [`${skill.folder}: ${SKILL_FILE} is missing`] : skillProblems(skill.folder, skillFile.text);
  });
  if (problems.length > 0) {
    throw new CruzeError("invalid-bundle", `The bundled skills are invalid:\n${problems.join("\n")}`);
  }
}

async function writeSkill(files: ProjectFiles, skill: BundledSkill): Promise<void> {
  const dir = posix.join(SHARED_SKILLS_DIR, installedSkillName(skill.folder));
  await files.remove(dir);
  for (const file of skill.files) {
    await files.writeText(posix.join(dir, file.path), file.text);
  }
}

/** Removes Cruze skills in `dir` that are not in `keep`, returning their names. */
async function removeStaleSkills(files: ProjectFiles, dir: string, keep: string[]): Promise<string[]> {
  const stale = (await files.listEntries(dir)).filter((name) => isInstalledSkillName(name) && !keep.includes(name));
  for (const name of stale) {
    await files.remove(posix.join(dir, name));
  }
  return stale;
}

async function agentsToLink(files: ProjectFiles, requested: string[]): Promise<string[]> {
  const unknown = requested.filter((agent) => agentSkillHome(agent) === undefined);
  if (unknown.length > 0) {
    throw new CruzeError("unknown-agent", `Unknown agent: ${unknown.join(", ")}. Known agents: ${knownAgents().join(", ")}.`);
  }
  const agents = new Set(requested);
  for (const home of AGENT_SKILL_HOMES) {
    for (const marker of home.markers) {
      if (await files.exists(marker)) agents.add(home.agent);
    }
  }
  return [...agents];
}
