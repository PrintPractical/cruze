/**
 * The part of a source file its budgets measure. Budgets apply to source, not tests, so a Rust
 * file's test-only modules are left out: rustfmt closes a top-level module with `}` in column 0.
 * A module is test-only when its `cfg` needs `test`, as `#[cfg(test)]` or
 * `#[cfg(all(test, feature = "schema"))]` do; other attributes may sit between the two.
 */
export function budgetedText(path: string, text: string): string {
  if (!path.endsWith(".rs")) return text;
  const lines = text.split("\n");
  const kept: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const start = testModuleStart(lines, i);
    if (start === null) {
      kept.push(lines[i] ?? "");
      continue;
    }
    if ((lines[start] ?? "").trimEnd().endsWith(";")) {
      i = start;
      continue;
    }
    let end = start + 1;
    while (end < lines.length && lines[end] !== "}") end++;
    i = end;
  }
  return kept.join("\n");
}

/** The line of the `mod` a test-only `cfg` at `index` gates, or null when it gates no module. */
function testModuleStart(lines: string[], index: number): number | null {
  if (!needsTest(lines[index]?.trim() ?? "")) return null;
  let next = index + 1;
  while (/^\s*#\[/.test(lines[next] ?? "")) next++;
  return /^(?:pub(?:\([^)]*\))?\s+)?mod\s+\w+\s*[{;]/.test(lines[next] ?? "") ? next : null;
}

function needsTest(attribute: string): boolean {
  const predicate = /^#\[cfg\((.*)\)\]$/.exec(attribute)?.[1]?.trim();
  if (predicate === undefined) return false;
  if (predicate === "test") return true;
  const all = /^all\((.*)\)$/.exec(predicate)?.[1];
  return all !== undefined && topLevelArguments(all).includes("test");
}

/** Splits `a, b(c, d), e` at its top-level commas. */
function topLevelArguments(text: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = "";
  for (const char of text) {
    if (char === "," && depth === 0) {
      parts.push(current.trim());
      current = "";
      continue;
    }
    if (char === "(") depth++;
    if (char === ")") depth--;
    current += char;
  }
  parts.push(current.trim());
  return parts;
}
