/**
 * A line diff of two texts as unified-diff lines: "  " for a kept line, "- " removed, "+ " added.
 * Only the changes and `context` kept lines around each are shown; "…" marks the lines left out.
 */
export function lineDiff(before: string[], after: string[], context = 2): string[] {
  const ops = diffOps(before, after);
  const near = new Set<number>();
  ops.forEach((op, i) => {
    if (op.kind === " ") return;
    for (let j = Math.max(0, i - context); j <= Math.min(ops.length - 1, i + context); j++) near.add(j);
  });
  const lines: string[] = [];
  let skipped = false;
  ops.forEach((op, i) => {
    if (!near.has(i)) {
      skipped = true;
      return;
    }
    if (skipped && lines.length > 0) lines.push("…");
    skipped = false;
    lines.push(`${op.kind} ${op.line}`);
  });
  if (skipped && lines.length > 0) lines.push("…");
  return lines;
}

interface Op {
  kind: " " | "-" | "+";
  line: string;
}

/** The edit script of a longest common subsequence: documents are small enough for the quadratic table. */
function diffOps(a: string[], b: string[]): Op[] {
  const width = b.length + 1;
  const table = new Int32Array((a.length + 1) * width);
  const at = (i: number, j: number): number => table[i * width + j] ?? 0;
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      table[i * width + j] = a[i] === b[j] ? at(i + 1, j + 1) + 1 : Math.max(at(i + 1, j), at(i, j + 1));
    }
  }
  const ops: Op[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length || j < b.length) {
    if (i < a.length && j < b.length && a[i] === b[j]) {
      ops.push({ kind: " ", line: a[i++] ?? "" });
      j++;
    } else if (j >= b.length || (i < a.length && at(i + 1, j) >= at(i, j + 1))) {
      ops.push({ kind: "-", line: a[i++] ?? "" });
    } else {
      ops.push({ kind: "+", line: b[j++] ?? "" });
    }
  }
  return ops;
}
