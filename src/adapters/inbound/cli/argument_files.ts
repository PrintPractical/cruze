import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { UsageError } from "./cli_context.ts";

// Files a person or agent names on the command line, such as a scratch file of review blockers or
// the path for an exported bundle. They may be anywhere, unlike project files, and relative paths
// resolve against the working directory.

export async function readArgumentFile(path: string): Promise<string> {
  try {
    return await readFile(resolve(path), "utf8");
  } catch (error) {
    throw new UsageError(`cannot read ${path}: ${reason(error)}`);
  }
}

export async function writeArgumentFile(path: string, text: string): Promise<void> {
  try {
    await mkdir(dirname(resolve(path)), { recursive: true });
    await writeFile(resolve(path), text, "utf8");
  } catch (error) {
    throw new UsageError(`cannot write ${path}: ${reason(error)}`);
  }
}

function reason(error: unknown): string {
  if (error instanceof Error && "code" in error && typeof error.code === "string") return error.code;
  return error instanceof Error ? error.message : String(error);
}
