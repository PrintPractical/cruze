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
  { path: ".cruze/config.yaml", template: "init/config.yaml" },
  { path: ".github/workflows/ci.yml", template: "init/ci.yml" },
  { path: ".gitattributes", template: "init/gitattributes" },
];

/**
 * The agents `cruze init` sets a project up for: Claude Code, which gets `CLAUDE.md`, linked skills
 * and a review command, or any other agent, which reads `AGENTS.md` and `.agents/skills/`.
 */
export const INIT_AGENTS = ["claude", "other"] as const;
export type InitAgent = (typeof INIT_AGENTS)[number];

/** Claude Code reads `CLAUDE.md`, so init links it to `AGENTS.md` rather than keeping a second copy. */
export const CLAUDE_INSTRUCTIONS = { path: "CLAUDE.md", target: "AGENTS.md" };

/** The template for the config's `review:` setting, which only Claude Code gets filled in. */
export function reviewSettingTemplate(agent: InitAgent): string {
  return `init/review/${agent}.yaml`;
}

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
