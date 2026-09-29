import { CruzeError } from "../../domain/cruze_error.ts";
import { agentSkillHome } from "../../domain/agent_skill_homes.ts";
import { parseProjectName } from "../../domain/project_name.ts";
import { CLAUDE_INSTRUCTIONS, INIT_AGENTS, INIT_SCAFFOLD, type InitAgent, renderTemplate, reviewSettingTemplate } from "../../domain/scaffold.ts";
import type { Bundle } from "../ports/bundle.ts";
import type { ProjectFiles } from "../ports/project_files.ts";
import type { Prompter } from "../ports/prompter.ts";
import { installSkills, type InstallSkillsReport } from "./install_skills.ts";

export interface InitProjectRequest {
  /** The project name; asked for when absent. */
  name?: string;
  /** Offered as the default answer when asking for the name. */
  defaultName: string;
  /** From `--agent`: `claude`, `other`, or agents to link skills for. Asked for when it names neither. */
  agents: string[];
  /**
   * How CI runs this version of Cruze through npx, such as `github:PrintPractical/cruze#v0.0.1`
   * for a git install. Defaults to the published npm package at this version.
   */
  package?: string;
}

export interface InitProjectReport {
  project: string;
  agent: InitAgent;
  created: string[];
  /** Files that already existed and were left untouched. */
  skipped: string[];
  skills: InstallSkillsReport;
}

/**
 * Gives a repository the Cruze starting files and installs the skills. Existing
 * files are never overwritten, so running it in a brownfield repo is safe.
 */
export async function initProject(
  deps: { files: ProjectFiles; bundle: Bundle; prompter: Prompter },
  request: InitProjectRequest,
): Promise<InitProjectReport> {
  const { files, bundle, prompter } = deps;
  const project = parseProjectName(request.name ?? (await prompter.ask("Project name", request.defaultName)));
  const agent = await chooseAgent(files, prompter, request.agents);
  const values = {
    project_name: project,
    project_name_quoted: JSON.stringify(project),
    cruze_version: bundle.version,
    cruze_package: request.package ?? `@printpractical/cruze@${bundle.version}`,
    review_setting: (await bundle.template(reviewSettingTemplate(agent))).trimEnd(),
  };

  const created: string[] = [];
  const skipped: string[] = [];
  for (const entry of INIT_SCAFFOLD) {
    if (await files.exists(entry.path)) {
      skipped.push(entry.path);
      continue;
    }
    await files.writeText(entry.path, renderTemplate(await bundle.template(entry.template), values));
    created.push(entry.path);
  }
  if (agent === "claude") {
    if (await files.exists(CLAUDE_INSTRUCTIONS.path)) skipped.push(CLAUDE_INSTRUCTIONS.path);
    else {
      await files.link(CLAUDE_INSTRUCTIONS.path, CLAUDE_INSTRUCTIONS.target);
      created.push(CLAUDE_INSTRUCTIONS.path);
    }
  }

  const linkFor = new Set(request.agents.filter((a) => a !== "other"));
  if (agent === "claude") linkFor.add("claude");
  const skills = await installSkills({ files, bundle }, { agents: [...linkFor] });
  return { project, agent, created, skipped, skills };
}

/** The agent named with `--agent`, or shown by the project's files, or else the answer to asking. */
async function chooseAgent(files: ProjectFiles, prompter: Prompter, requested: string[]): Promise<InitAgent> {
  if (requested.includes("claude")) return "claude";
  if (requested.includes("other")) return "other";
  for (const marker of agentSkillHome("claude")?.markers ?? []) {
    if (await files.exists(marker)) return "claude";
  }
  const answer = (await prompter.ask(`Coding agent (${INIT_AGENTS.join(" or ")})`, "claude")).trim().toLowerCase();
  const agent = INIT_AGENTS.find((a) => a === answer);
  if (agent === undefined) throw new CruzeError("unknown-agent", `Unknown agent: ${answer}. Answer ${INIT_AGENTS.join(" or ")}, or pass --agent.`);
  return agent;
}
