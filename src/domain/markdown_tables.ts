/** Pipe tables: header cells and body rows, each row with its line number. */
export interface Table {
  header: string[];
  rows: Array<{ cells: string[]; line: number }>;
}

/** Tables found in lines [from, to), skipping fenced code. */
export function tablesIn(lines: string[], inFence: boolean[], from: number, to: number): Table[] {
  const tables: Table[] = [];
  let current: Table | null = null;
  for (let i = from; i < to; i++) {
    const line = lines[i] ?? "";
    const isRow = !inFence[i] && /^\s*\|.*\|\s*$/.test(line);
    if (!isRow) {
      current = null;
      continue;
    }
    const cells = splitRow(line);
    if (current === null) {
      current = { header: cells, rows: [] };
      tables.push(current);
    } else if (cells.every((cell) => /^:?-{3,}:?$/.test(cell))) {
      continue;
    } else {
      current.rows.push({ cells, line: i });
    }
  }
  return tables;
}

export function splitRow(line: string): string[] {
  const inner = line.trim().replace(/^\|/, "").replace(/\|$/, "");
  return inner.split("|").map((cell) => cell.trim());
}
