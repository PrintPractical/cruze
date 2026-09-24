/**
 * Where agents look for skills. Skills are installed once into the shared
 * Agent Skills directory; agents that don't read it get links in their own.
 */

export const SHARED_SKILLS_DIR = ".agents/skills";

export interface AgentSkillHome {
  agent: string;
  skillsDir: string;
  /** Paths whose presence shows the project uses this agent. */
  markers: string[];
}

export const AGENT_SKILL_HOMES: readonly AgentSkillHome[] = [
  { agent: "claude", skillsDir: ".claude/skills", markers: ["CLAUDE.md", ".claude"] },
];

export function knownAgents(): string[] {
  return AGENT_SKILL_HOMES.map((home) => home.agent);
}

export function agentSkillHome(agent: string): AgentSkillHome | undefined {
  return AGENT_SKILL_HOMES.find((home) => home.agent === agent);
}
