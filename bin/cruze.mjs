#!/usr/bin/env node
// The `cruze` command. A git install carries the TypeScript sources but no dist/, because npm
// runs no build scripts for it; the first run builds dist/ with Node alone, then starts the CLI.
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const main = new URL("../dist/main.js", import.meta.url);
if (!existsSync(fileURLToPath(main))) {
  process.emitWarning = () => {};
  try {
    await import("../scripts/build.mjs");
  } catch (error) {
    process.stderr.write(`cruze: could not build the CLI in ${fileURLToPath(new URL("..", import.meta.url))}: ${error.message}\n`);
    process.exit(1);
  }
}
await import(main.href);
