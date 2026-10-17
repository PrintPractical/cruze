import { buildProjectDocs, type ProjectDocs } from "../domain/project/project_docs.ts";
import { CruzeError } from "../domain/cruze_error.ts";
import type { CruzeConfig } from "../domain/config.ts";
import type { Bundle } from "./ports/bundle.ts";
import type { Clock } from "./ports/clock.ts";
import type { ProjectFiles } from "./ports/project_files.ts";
import type { Repository } from "./ports/repository.ts";

/** What the project use cases work with. */
export interface ProjectDeps {
  files: ProjectFiles;
  clock: Clock;
  repository: Repository;
  bundle: Bundle;
}

/** Directories whose files make up the project's documents. */
const DOC_ROOTS = ["docs", ".cruze"] as const;

/** Reads every document under docs/ and .cruze/. */
export async function loadDocs(files: ProjectFiles): Promise<ProjectDocs> {
  const snapshot = new Map<string, string>();
  for (const root of DOC_ROOTS) {
    for (const path of await files.listFiles(root)) {
      const text = await files.readText(path);
      if (text !== undefined) snapshot.set(path, text);
    }
  }
  return buildProjectDocs(snapshot);
}

/** The project's config, or an error telling the user to fix it first. */
export function requireConfig(docs: ProjectDocs): CruzeConfig {
  const config = docs.config?.config;
  if (config === null || config === undefined) throw new CruzeError("config", "fix .cruze/config.yaml first; run cruze validate for details");
  return config;
}
