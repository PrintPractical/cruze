import { existsSync } from "node:fs";
import { dirname, join } from "node:path";

/** The nearest directory at or above `start` that holds `.cruze/config.yaml`, or undefined when none does. */
export function findProjectRoot(start: string): string | undefined {
  let dir = start;
  for (;;) {
    if (existsSync(join(dir, ".cruze", "config.yaml"))) return dir;
    const parent = dirname(dir);
    if (parent === dir) return undefined;
    dir = parent;
  }
}
