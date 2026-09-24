/** Resolves Rust `use` paths inside a crate to candidate source files. */

/** Candidate files for each `use crate::…`, `use super::…` and `use self::…` path in a Rust file. */
export function rustImportCandidates(path: string, text: string): Array<{ line: number; candidates: string[] }> {
  const root = crateRoot(path);
  if (root === null) return [];
  const own = moduleSegments(path, root);
  const results: Array<{ line: number; candidates: string[] }> = [];
  const pattern = /^\s*(?:pub(?:\([^)]*\))?\s+)?use\s+([^;]+);/gms;
  for (const match of text.matchAll(pattern)) {
    const line = text.slice(0, match.index).split("\n").length - 1;
    for (const segments of expandUse((match[1] ?? "").replace(/\s+/g, ""))) {
      const absolute = absoluteSegments(segments, own);
      if (absolute !== null) results.push({ line, candidates: candidatesFor(root, absolute) });
    }
  }
  return results;
}

/** The directory holding the crate root: everything up to and including `src/`. */
function crateRoot(path: string): string | null {
  const index = path.lastIndexOf("src/");
  return index === -1 ? null : path.slice(0, index + "src/".length);
}

/** The module path of a file: `src/a/b.rs` and `src/a/b/mod.rs` are both `a::b`. */
function moduleSegments(path: string, root: string): string[] {
  const rest = path.slice(root.length).replace(/\.rs$/, "");
  const segments = rest.split("/");
  const last = segments[segments.length - 1];
  if (last === "mod" || (segments.length === 1 && (last === "lib" || last === "main"))) segments.pop();
  return segments;
}

/** `a::{b, c::d}` becomes `[a, b]` and `[a, c, d]`. */
function expandUse(tree: string): string[][] {
  const brace = tree.indexOf("{");
  if (brace === -1) return [tree.split("::").filter((s) => s !== "" && s !== "*").map((s) => s.split(" as ")[0] ?? s)];
  const prefix = tree.slice(0, brace).split("::").filter((s) => s !== "");
  const inner = tree.slice(brace + 1, tree.lastIndexOf("}"));
  return splitTopLevel(inner).flatMap((part) => (part === "self" ? [prefix] : expandUse(part).map((rest) => [...prefix, ...rest])));
}

function splitTopLevel(inner: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = "";
  for (const char of inner) {
    if (char === "{") depth++;
    if (char === "}") depth--;
    if (char === "," && depth === 0) {
      parts.push(current);
      current = "";
    } else current += char;
  }
  if (current !== "") parts.push(current);
  return parts.filter((part) => part !== "");
}

function absoluteSegments(segments: string[], own: string[]): string[] | null {
  const [head, ...rest] = segments;
  if (head === "crate") return rest;
  if (head === "self") return [...own, ...rest];
  if (head === "super") {
    let base = own.slice(0, -1);
    let tail = rest;
    while (tail[0] === "super") {
      base = base.slice(0, -1);
      tail = tail.slice(1);
    }
    return [...base, ...tail];
  }
  return null;
}

/** The longest module path first: an imported item may be a type inside a module file. */
function candidatesFor(root: string, segments: string[]): string[] {
  const candidates: string[] = [];
  for (let n = segments.length; n > 0; n--) {
    const module = segments.slice(0, n).join("/");
    candidates.push(`${root}${module}.rs`, `${root}${module}/mod.rs`);
  }
  return candidates;
}
