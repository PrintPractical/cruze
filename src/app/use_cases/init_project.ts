import { parseProjectName } from "../../domain/project_name.ts";
import { INIT_SCAFFOLD, renderTemplate } from "../../domain/scaffold.ts";
import type { Bundle } from "../ports/bundle.ts";
import type { ProjectFiles } from "../ports/project_files.ts";
import type { Prompter } from "../ports/prompter.ts";
import { installSkills, type InstallSkillsReport } from "./install_skills.ts";

export interface InitProjectRequest {
  /** The project name; asked for when absent. */
  name?: string;
  /** Offered as the default answer when asking for the name. */
  defaultName: string;
  agents: string[];
  /**
   * How CI runs this version of Cruze through npx, such as `github:PrintPractical/cruze#v0.0.1`
   * for a git install. Defaults to the published npm package at this version.
   */
  package?: string;
}

export interface InitProjectReport {
  project: string;
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
  const values = {
    project_name: project,
    project_name_quoted: JSON.stringify(project),
    cruze_version: bundle.version,
    cruze_package: request.package ?? `@printpractical/cruze@${bundle.version}`,
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

  const skills = await installSkills({ files, bundle }, { agents: request.agents });
  return { project, created, skipped, skills };
}
