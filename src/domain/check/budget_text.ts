/**
 * The part of a source file its budgets measure. Budgets apply to source, not tests, so a Rust
 * file's `#[cfg(test)]` modules are left out: rustfmt closes a top-level module with `}` in column 0.
 */
export function budgetedText(path: string, text: string): string {
  if (!path.endsWith(".rs")) return text;
  const lines = text.split("\n");
  const kept: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const item = lines[i + 1] ?? "";
    if (lines[i]?.trim() !== "#[cfg(test)]" || !/^(?:pub(?:\([^)]*\))?\s+)?mod\s+\w+\s*[{;]/.test(item)) {
      kept.push(lines[i] ?? "");
      continue;
    }
    if (item.trimEnd().endsWith(";")) {
      i += 1;
      continue;
    }
    let end = i + 2;
    while (end < lines.length && lines[end] !== "}") end++;
    i = end;
  }
  return kept.join("\n");
}
