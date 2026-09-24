import { MANAGED_CLOSE, MANAGED_OPEN, parseMarkdown } from "../markdown.ts";
import { readTasks } from "../project/plan_parts.ts";
import { progressRange, readProgress, type Progress } from "../project/progress.ts";

/** Rewrites the managed `## Progress` block of a feature or change from a changed Progress. */
export function updateProgress(text: string, change: (progress: Progress) => void): string {
  const doc = parseMarkdown(text);
  const progress = readProgress(doc);
  for (const task of readTasks(doc).tasks) if (!progress.tasks.has(task.number)) progress.tasks.set(task.number, null);
  change(progress);
  const block = [MANAGED_OPEN, "## Progress", ...renderProgress(progress), MANAGED_CLOSE];
  const range = progressRange(doc);
  const lines = [...doc.lines];
  if (range === null) {
    while (lines.length > 0 && lines[lines.length - 1] === "") lines.pop();
    return [...lines, "", ...block, ""].join("\n");
  }
  lines.splice(range.open, range.end - range.open + 1, ...block);
  return lines.join("\n");
}

function renderProgress(progress: Progress): string[] {
  const lines: string[] = [];
  if (progress.branch !== undefined) lines.push(`- Branch: ${progress.branch}`);
  for (const [change, state] of progress.changes) lines.push(`- ${change}: ${state}`);
  const ordered = [...progress.tasks].sort(([a], [b]) => Number(a.slice(1)) - Number(b.slice(1)));
  for (const [task, commit] of ordered) {
    lines.push(commit === null ? `- [ ] ${task}` : commit === "" ? `- [x] ${task}` : `- [x] ${task} (${commit})`);
  }
  for (const deviation of progress.deviations) lines.push(`- Deviation ${deviation}`);
  if (progress.landed !== undefined) lines.push(`- Landed: ${progress.landed}`);
  return lines;
}
