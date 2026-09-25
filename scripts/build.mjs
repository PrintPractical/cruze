// Builds dist/ from src/ by erasing the TypeScript types with Node's own type stripper.
// It needs no dependencies, so it also runs on a user's machine: bin/cruze.mjs calls it on
// first run when dist/ is missing, as it is after a git install. The sources use erasable
// syntax only (tsconfig's erasableSyntaxOnly), so erasing the types is the whole build.
import { chmodSync, existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const src = join(root, "src");
const dist = join(root, "dist");
const RELATIVE_TS_IMPORT = /((?:from|import)\s*\(?\s*)(["'])(\.{1,2}\/[^"']+)\.ts\2/g;

const sources = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? sources(join(dir, entry.name)) : entry.name.endsWith(".ts") ? [join(dir, entry.name)] : [],
  );

// Build beside dist/ and swap it in, so a concurrent first run never sees half a build.
const staging = `${dist}.${process.pid}`;
rmSync(staging, { recursive: true, force: true });
for (const file of sources(src)) {
  const code = stripTypeScriptTypes(readFileSync(file, "utf8"), { mode: "strip" }).replace(RELATIVE_TS_IMPORT, "$1$2$3.js$2");
  const target = join(staging, relative(src, file)).replace(/\.ts$/, ".js");
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, code);
}
chmodSync(join(staging, "main.js"), 0o755);
rmSync(dist, { recursive: true, force: true });
try {
  renameSync(staging, dist);
} catch (error) {
  // Another process finished its build first; use that one.
  rmSync(staging, { recursive: true, force: true });
  if (!existsSync(join(dist, "main.js"))) throw error;
}
