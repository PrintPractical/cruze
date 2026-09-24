/** The files `cruze init` gives a repository, and how their templates are filled. */

export interface ScaffoldEntry {
  /** Where the file goes, relative to the project root. */
  path: string;
  /** The template it is rendered from, relative to the bundle's templates directory. */
  template: string;
}

export const INIT_SCAFFOLD: readonly ScaffoldEntry[] = [
  { path: "README.md", template: "init/README.md" },
  { path: "CHANGELOG.md", template: "init/CHANGELOG.md" },
  { path: "AGENTS.md", template: "init/AGENTS.md" },
  { path: "CLAUDE.md", template: "init/CLAUDE.md" },
  { path: ".cruze/config.yaml", template: "init/config.yaml" },
  { path: ".github/workflows/ci.yml", template: "init/ci.yml" },
];

/** Replaces every `{{key}}` with its value; an unknown key is a template bug. */
export function renderTemplate(template: string, values: Record<string, string>): string {
  return template.replace(/\{\{([a-z_]+)\}\}/g, (placeholder, key: string) => {
    const value = values[key];
    if (value === undefined) {
      throw new Error(`Template placeholder ${placeholder} has no value`);
    }
    return value;
  });
}
