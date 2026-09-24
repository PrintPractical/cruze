import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

export const EXAMPLE_ROOT = fileURLToPath(new URL("../../examples/console-access", import.meta.url));

/** Every file under docs/ and .cruze/ of a directory, keyed by project-relative path. */
export function snapshotFromDisk(root: string): Map<string, string> {
  const snapshot = new Map<string, string>();
  const walk = (dir: string): void => {
    for (const name of readdirSync(dir)) {
      const full = join(dir, name);
      if (statSync(full).isDirectory()) walk(full);
      else snapshot.set(relative(root, full).split(sep).join("/"), readFileSync(full, "utf8"));
    }
  };
  for (const top of ["docs", ".cruze"]) {
    try {
      walk(join(root, top));
    } catch {
      // A project may not have both directories yet.
    }
  }
  return snapshot;
}
