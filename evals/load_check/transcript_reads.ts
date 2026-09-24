/**
 * The Cruze skill files a Claude Code session loaded, read from its JSONL transcript.
 * A file counts as loaded when the agent read it, printed it from a shell command,
 * or invoked its skill (which loads the skill's SKILL.md).
 */

interface ToolUse {
  type?: string;
  name?: string;
  input?: Record<string, unknown>;
}

const SKILL_PATH = /skills\/(cruze-[a-z0-9]+(?:-[a-z0-9]+)*)\/([\w./-]*\w)/g;

/** Keys of the form `cruze-<name>/<file>` for every skill file the transcript loaded. */
export function skillFilesRead(transcript: string): Set<string> {
  const read = new Set<string>();
  for (const block of toolUses(transcript)) {
    const input = block.input ?? {};
    if (block.name === "Skill" && typeof input["skill"] === "string") read.add(`${input["skill"]}/SKILL.md`);
    const text = block.name === "Read" ? input["file_path"] : block.name === "Bash" ? input["command"] : undefined;
    if (typeof text !== "string") continue;
    for (const match of text.matchAll(SKILL_PATH)) read.add(`${match[1]}/${match[2]}`);
  }
  return read;
}

function toolUses(transcript: string): ToolUse[] {
  const uses: ToolUse[] = [];
  for (const line of transcript.split("\n")) {
    if (line.trim() === "") continue;
    let entry: { type?: string; message?: { content?: unknown } };
    try {
      entry = JSON.parse(line) as typeof entry;
    } catch {
      continue;
    }
    const content = entry.message?.content;
    if (entry.type !== "assistant" || !Array.isArray(content)) continue;
    uses.push(...(content as ToolUse[]).filter((block) => block.type === "tool_use"));
  }
  return uses;
}
