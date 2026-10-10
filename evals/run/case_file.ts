/**
 * An eval case file (evals/cases/<date>-<slug>.md): the Expected and Check text a grader
 * reads, and the optional `## Run` section that makes the case executable.
 */

export const DEFAULT_TOOLS = "Read,Edit,Write,Grep,Glob,Bash";

export interface RunSection {
  /** Shell commands run inside the fixture copy before the agent starts. */
  setup?: string;
  /** The prompt given to the agent. */
  prompt: string;
  /** The agent's allowed tools, comma-separated. */
  tools: string;
}

export interface EvalCase {
  name: string;
  expected: string;
  check: string;
  /** Absent for a manual case. */
  run?: RunSection;
}

export function parseCase(text: string): EvalCase {
  const sections = splitSections(text);
  const run = sections.get("Run");
  return {
    name: text.match(/^# (.+)$/m)?.[1]?.trim() ?? "",
    expected: (sections.get("Expected") ?? "").trim(),
    check: (sections.get("Check") ?? "").trim(),
    ...(run === undefined ? {} : { run: parseRunSection(run) }),
  };
}

const FENCE = /^(\s*)(`{3,}|~{3,})/;

/** The body under each `## ` heading, ignoring headings inside fenced blocks. */
function splitSections(text: string): Map<string, string> {
  const sections = new Map<string, string>();
  let heading: string | undefined;
  let body: string[] = [];
  let fence: string | undefined;
  for (const line of text.split("\n")) {
    const marker = line.match(FENCE)?.[2];
    if (fence === undefined && marker !== undefined) fence = marker;
    else if (fence !== undefined && marker !== undefined && closes(marker, fence)) fence = undefined;
    const title = fence === undefined ? line.match(/^## (.+)$/)?.[1] : undefined;
    if (title === undefined) {
      if (heading !== undefined) body.push(line);
      continue;
    }
    if (heading !== undefined) sections.set(heading, body.join("\n"));
    heading = title.trim();
    body = [];
  }
  if (heading !== undefined) sections.set(heading, body.join("\n"));
  return sections;
}

function closes(marker: string, fence: string): boolean {
  return marker[0] === fence[0] && marker.length >= fence.length;
}

/**
 * A `- Setup:` bullet claims the fenced block after it; any other fenced block is the
 * prompt; a `- Tools:` bullet names the allowed tools.
 */
function parseRunSection(body: string): RunSection {
  const lines = body.split("\n");
  let setup: string | undefined;
  let prompt: string | undefined;
  let tools = DEFAULT_TOOLS;
  let setupNext = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? "";
    const fence = line.match(FENCE);
    if (fence !== null) {
      const [block, end] = fencedBlock(lines, i, fence[1] ?? "", fence[2] ?? "```");
      if (setupNext) setup = block;
      else if (prompt === undefined) prompt = block;
      else throw new Error("## Run has more than one fenced block for the prompt");
      setupNext = false;
      i = end;
      continue;
    }
    if (/^\s*-\s*Setup:\s*$/.test(line)) setupNext = true;
    const named = line.match(/^\s*-\s*Tools:\s*(.+?)\s*$/)?.[1];
    if (named !== undefined) tools = named;
  }
  if (prompt === undefined) throw new Error("## Run has no fenced block holding the prompt");
  return { ...(setup === undefined ? {} : { setup }), prompt, tools };
}

/** The block's content with the fence's indent removed, and the index of its closing line. */
function fencedBlock(lines: string[], start: number, indent: string, fence: string): [string, number] {
  const content: string[] = [];
  for (let i = start + 1; i < lines.length; i++) {
    const line = lines[i] ?? "";
    const marker = line.match(FENCE)?.[2];
    if (marker !== undefined && closes(marker, fence)) return [content.join("\n"), i];
    content.push(line.startsWith(indent) ? line.slice(indent.length) : line.trimStart());
  }
  throw new Error("## Run has an unclosed fenced block");
}
