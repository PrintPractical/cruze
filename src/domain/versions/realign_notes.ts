import { compareVersions } from "./cruze_version.ts";

/**
 * A realign note: one change in what Cruze expects of a project, shipped in
 * `skills/realign/notes/<version>.md` so `realign` can bring existing code up to it.
 */
export interface RealignNote {
  id: string;
  title: string;
  version: string;
  /** Whether existing code and documents must change, or only new work follows it. */
  appliesTo: "existing" | "new";
  /** Where the rule lives, such as a skill file and its heading. */
  rule: string;
  /** A CLI rule that finds it mechanically, as `<command>:<rule>`. */
  detect?: string;
  /** The question an auditor answers when no CLI rule can. */
  ask?: string;
  migrate?: string;
}

export interface ParsedNotes {
  notes: RealignNote[];
  problems: string[];
}

const APPLIES: Record<string, RealignNote["appliesTo"]> = { "existing code": "existing", "new work only": "new" };

/** Parses one version's notes file. Each note is a `### <id>: <title>` heading with facts under it. */
export function parseRealignNotes(version: string, text: string): ParsedNotes {
  const notes: RealignNote[] = [];
  const problems: string[] = [];
  const sections = text.split(/^### /m).slice(1);
  for (const section of sections) {
    const [heading = "", ...body] = section.split("\n");
    const match = /^([a-z0-9]+(?:-[a-z0-9]+)*): (.+)$/.exec(heading.trim());
    if (match === null) {
      problems.push(`${version}: "### ${heading.trim()}" must read "### <id>: <title>"`);
      continue;
    }
    const [, id = "", title = ""] = match;
    const fact = (key: string): string | undefined => body.map((line) => new RegExp(`^- ${key}: (.+)$`).exec(line)?.[1]?.trim()).find((v) => v !== undefined);
    const applies = APPLIES[fact("Applies to") ?? ""];
    const rule = fact("Rule");
    const detect = fact("Detect")?.replace(/`/g, "");
    const ask = fact("Ask");
    const migrate = fact("Migrate");
    if (applies === undefined) problems.push(`${version} ${id}: "- Applies to:" must be "existing code" or "new work only"`);
    if (rule === undefined) problems.push(`${version} ${id}: needs "- Rule:"`);
    if (detect !== undefined && !/^(check|validate):[a-z-]+$/.test(detect)) problems.push(`${version} ${id}: "- Detect:" names a rule as check:<rule> or validate:<rule>`);
    if (applies === "existing" && detect === undefined && ask === undefined) problems.push(`${version} ${id}: a note for existing code needs "- Detect:" or "- Ask:"`);
    if (applies === "existing" && migrate === undefined) problems.push(`${version} ${id}: a note for existing code needs "- Migrate:"`);
    notes.push({
      id,
      title,
      version,
      appliesTo: applies ?? "new",
      rule: rule ?? "",
      ...(detect === undefined ? {} : { detect }),
      ...(ask === undefined ? {} : { ask }),
      ...(migrate === undefined ? {} : { migrate }),
    });
  }
  const ids = notes.map((n) => n.id);
  ids.filter((id, i) => ids.indexOf(id) !== i).forEach((id) => problems.push(`${version}: note ${id} appears twice`));
  return { notes, problems };
}

/** Notes after the version the code meets, up to and including the version installed. */
export function notesBetween(notes: RealignNote[], standards: string, target: string): RealignNote[] {
  return notes.filter((n) => compareVersions(n.version, standards) > 0 && compareVersions(n.version, target) <= 0);
}
