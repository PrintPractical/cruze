import { readRows } from "../edits/managed_tables.ts";
import { parseMarkdown } from "../markdown.ts";
import { tablesIn } from "../markdown_tables.ts";

/** The items of `docs/roadmap.md`, as the cruze-formats skill defines them. */

export interface RoadmapItem {
  slug: string;
  kind: string;
  goals: string;
  blockedBy: string[];
  phase: number;
  line: number;
}

export interface RoadmapStatusRow {
  slug: string;
  id: string;
  state: string;
}

/** Every item in the roadmap's phases, in the order they appear. */
export function readRoadmapItems(text: string): RoadmapItem[] {
  const doc = parseMarkdown(text);
  const items: RoadmapItem[] = [];
  for (const phase of doc.headings.filter((h) => h.level === 3 && /^Phase \d+: /.test(h.text))) {
    const number = Number(/^Phase (\d+)/.exec(phase.text)?.[1] ?? 0);
    const end = doc.headings.find((h) => h.line > phase.line && h.level <= 3)?.line ?? doc.lines.length;
    for (const table of tablesIn(doc.lines, doc.inFence, phase.line + 1, end)) {
      for (const { cells, line } of table.rows) {
        const [slug = "", kind = "", goals = "", blocked = ""] = cells;
        const blockedBy = blocked.split(",").map((s) => s.trim()).filter((s) => s !== "");
        items.push({ slug, kind, goals, blockedBy, phase: number, line });
      }
    }
  }
  return items;
}

/** The managed `## Status` rows: each started item's folder ID and state. */
export function readRoadmapStatus(text: string): RoadmapStatusRow[] {
  return readRows(text, "Status").map(([slug = "", id = "", state = ""]) => ({ slug, id, state }));
}
