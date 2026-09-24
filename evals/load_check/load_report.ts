import { installedSkillRefs } from "../../src/domain/skill_links.ts";

export interface LoadReport {
  /** Knowledge files the skill names, as `cruze-<name>/<file>`. */
  named: string[];
  missing: string[];
  passed: boolean;
}

/** Compares the files a skill names by installed path with the files a run loaded. */
export function loadReport(skillText: string, read: Set<string>): LoadReport {
  const named = installedSkillRefs(skillText).map((ref) => `${ref.skill}/${ref.path}`);
  const missing = named.filter((key) => !read.has(key));
  return { named, missing, passed: missing.length === 0 };
}
