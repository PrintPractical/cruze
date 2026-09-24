/** Counts top-level type declarations, by the file's language. */

const PATTERNS: Array<{ extensions: RegExp; declaration: RegExp }> = [
  { extensions: /\.(?:[cm]?[jt]sx?)$/, declaration: /^(?:export\s+)?(?:default\s+)?(?:declare\s+)?(?:abstract\s+)?(?:class|interface|enum|type)\s+[A-Za-z_]/ },
  { extensions: /\.py$/, declaration: /^class\s+[A-Za-z_]/ },
  { extensions: /\.rs$/, declaration: /^(?:pub(?:\([^)]*\))?\s+)?(?:struct|enum|trait|union|type)\s+[A-Za-z_]/ },
  { extensions: /\.go$/, declaration: /^type\s+[A-Za-z_]/ },
  { extensions: /\.(?:c|h|cc|cpp|cxx|hh|hpp|hxx)$/, declaration: /^(?:typedef\s+)?(?:struct|class|enum|union)\s+[A-Za-z_]\w*(?:\s*[:{].*)?$/ },
  { extensions: /\.(?:java|kt|swift|scala)$/, declaration: /^(?:(?:public|private|internal|open|final|abstract|data|sealed|static)\s+)*(?:class|interface|enum|object|struct|protocol|record)\s+[A-Za-z_]/ },
];

/** Top-level type declarations in the file, or null when its language isn't recognised. */
export function countTypes(path: string, text: string): number | null {
  const pattern = PATTERNS.find((p) => p.extensions.test(path));
  if (pattern === undefined) return null;
  return text.split("\n").filter((line) => pattern.declaration.test(line)).length;
}
