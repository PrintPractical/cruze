import { findSection, type MarkdownDoc } from "../markdown.ts";
import { tablesIn } from "../markdown_tables.ts";

/** One row of the vision's `## Release` table: a feature of the release, in build order, and the features it needs. */
export interface ReleaseFeature {
  slug: string;
  summary: string;
  needs: string[];
  /** 0-based line of its row. */
  line: number;
}

/** The release's features, from the first table under `## Release` with Feature and Needs columns. */
export function readRelease(vision: MarkdownDoc): ReleaseFeature[] {
  const section = findSection(vision, "Release");
  if (section === null) return [];
  const table = tablesIn(vision.lines, vision.inFence, section.start, section.end).find((t) => t.header.includes("Feature") && t.header.includes("Needs"));
  if (table === undefined) return [];
  const at = (name: string): number => table.header.indexOf(name);
  return table.rows.map(({ cells, line }) => ({
    slug: unquote(cells[at("Feature")] ?? ""),
    summary: at("Summary") === -1 ? "" : (cells[at("Summary")] ?? ""),
    needs: (cells[at("Needs")] ?? "").split(",").map(unquote).filter((need) => need !== "" && !/^[-—–]+$/.test(need)),
    line,
  }));
}

function unquote(cell: string): string {
  return cell.trim().replace(/^`(.*)`$/, "$1").trim();
}
