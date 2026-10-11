import { findDecisionCitations, type DecisionCitation } from "../decision_citations.ts";

const HASH_COMMENTS = new Set(["py", "rb", "sh", "bash", "zsh", "pl", "r", "ex", "exs", "jl", "nim", "cr", "ps1"]);
const DASH_COMMENTS = new Set(["sql", "lua", "hs", "elm", "ada"]);

/**
 * Decisions a source file's comments cite by number, such as `(D22)` or `(events D23)`. Each work
 * item numbers its decisions from D1 and is archived when it finishes, so a number in code points
 * at nothing a reader can find.
 */
export function decisionCitationsInComments(path: string, text: string): DecisionCitation[] {
  const comments = commentText(path, text.split("\n"));
  return findDecisionCitations(comments, new Set());
}

/** Each line with everything but its comment blanked, so a citation's line number stays right. */
function commentText(path: string, lines: string[]): string[] {
  const extension = path.slice(path.lastIndexOf(".") + 1).toLowerCase();
  if (HASH_COMMENTS.has(extension)) return lines.map((line) => after(line, /(^|\s)#/));
  if (DASH_COMMENTS.has(extension)) return lines.map((line) => after(line, /--/));
  let inBlock = false;
  return lines.map((line) => {
    if (inBlock) {
      if (line.includes("*/")) inBlock = false;
      return line;
    }
    const open = line.indexOf("/*");
    if (open !== -1 && !line.includes("*/", open + 2)) inBlock = true;
    const slash = line.indexOf("//");
    const start = [open, slash].filter((at) => at !== -1).sort((a, b) => a - b)[0];
    return start === undefined ? "" : line.slice(start);
  });
}

function after(line: string, marker: RegExp): string {
  const match = marker.exec(line);
  return match === null ? "" : line.slice(match.index);
}
