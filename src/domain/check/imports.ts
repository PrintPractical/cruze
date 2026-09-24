import { posix } from "node:path";
import { rustImportCandidates } from "./rust_imports.ts";

/** One import in a source file, with the project files it could refer to, most specific first. */
export interface SourceImport {
  line: number;
  candidates: string[];
  /** Match candidates against the end of project paths rather than exactly. */
  bySuffix: boolean;
}

const JS = /\.(?:[cm]?[jt]sx?)$/;
const JS_EXTENSIONS = ["", ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", "/index.ts", "/index.js"];

/** Imports that point inside the project. Imports of libraries and the standard library are left out. */
export function importsOf(path: string, text: string): SourceImport[] {
  if (JS.test(path)) return jsImports(path, text);
  if (path.endsWith(".py")) return pythonImports(path, text);
  if (path.endsWith(".rs")) return rustImportCandidates(path, text).map((i) => ({ ...i, bySuffix: false }));
  if (/\.(?:c|h|cc|cpp|cxx|hh|hpp|hxx)$/.test(path)) return matches(text, /^\s*#\s*include\s+"([^"]+)"/gm, (target) => [target], true);
  if (path.endsWith(".go")) return goImports(text);
  if (/\.(?:java|kt)$/.test(path)) return matches(text, /^import\s+(?:static\s+)?([\w.]+)(?:\.\*)?;?\s*$/gm, (t) => [`${t.replace(/\./g, "/")}.java`, `${t.replace(/\./g, "/")}.kt`], true);
  return [];
}

function jsImports(path: string, text: string): SourceImport[] {
  const pattern = /(?:\bfrom\s*|\bimport\s*\(?\s*|\brequire\s*\(\s*)["']([^"']+)["']/g;
  return matches(text, pattern, (target) => {
    if (!target.startsWith(".")) return [];
    const base = posix.normalize(posix.join(posix.dirname(path), target));
    const stripped = base.replace(/\.[cm]?jsx?$/, "");
    return [...new Set([...JS_EXTENSIONS.map((ext) => base + ext), ...JS_EXTENSIONS.map((ext) => stripped + ext)])];
  }, false);
}

function pythonImports(path: string, text: string): SourceImport[] {
  const results: SourceImport[] = [];
  for (const match of text.matchAll(/^\s*(?:from\s+(\.*)([\w.]*)\s+import\s+([\w, ]+)|import\s+([\w.]+))/gm)) {
    const line = text.slice(0, match.index).split("\n").length - 1;
    const dots = match[1] ?? "";
    const module = (match[2] ?? match[4] ?? "").split(".").filter((s) => s !== "");
    const names = (match[3] ?? "").split(",").map((s) => s.trim().split(" ")[0] ?? "").filter((s) => s !== "");
    const bases = dots === "" ? [module] : [[...posix.dirname(path).split("/").slice(0, dots.length === 1 ? undefined : -(dots.length - 1)), ...module]];
    const candidates = bases.flatMap((segments) => [
      ...names.map((name) => `${[...segments, name].join("/")}.py`),
      `${segments.join("/")}.py`,
      `${segments.join("/")}/__init__.py`,
    ]);
    results.push({ line, candidates, bySuffix: dots === "" });
  }
  return results;
}

function goImports(text: string): SourceImport[] {
  const results: SourceImport[] = [];
  for (const match of text.matchAll(/^\s*(?:import\s+)?(?:\w+\s+)?"([\w./-]+)"\s*$/gm)) {
    const line = text.slice(0, match.index).split("\n").length - 1;
    results.push({ line, candidates: [`${match[1] ?? ""}/`], bySuffix: true });
  }
  return results;
}

function matches(text: string, pattern: RegExp, candidates: (target: string) => string[], bySuffix: boolean): SourceImport[] {
  return [...text.matchAll(pattern)]
    .map((match) => ({ line: text.slice(0, match.index).split("\n").length - 1, candidates: candidates(match[1] ?? ""), bySuffix }))
    .filter((found) => found.candidates.length > 0);
}

/** The project file an import refers to, or undefined when it points outside the project. */
export function resolveImport(found: SourceImport, files: readonly string[]): string | undefined {
  for (const candidate of found.candidates) {
    if (candidate.endsWith("/")) {
      const inDir = files.find((f) => (found.bySuffix ? `/${f}`.includes(`/${candidate}`) : f.startsWith(candidate)));
      if (inDir !== undefined) return inDir;
      continue;
    }
    const hit = found.bySuffix ? files.find((f) => f === candidate || f.endsWith(`/${candidate}`)) : files.find((f) => f === candidate);
    if (hit !== undefined) return hit;
  }
  return undefined;
}
