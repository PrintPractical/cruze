import { existsSync } from "node:fs";
import { readFile, readdir } from "node:fs/promises";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import type { Bundle, BundledFile, BundledSkill } from "../../app/ports/bundle.ts";

/** The skills and templates shipped in the installed Cruze package. */
export class PackageBundle implements Bundle {
  readonly version: string;
  private readonly root: string;

  private constructor(root: string, version: string) {
    this.root = root;
    this.version = version;
  }

  /** Finds the package root by walking up from this module to the nearest package.json. */
  static async locate(fromUrl: string = import.meta.url): Promise<PackageBundle> {
    let dir = dirname(fileURLToPath(fromUrl));
    while (!existsSync(join(dir, "package.json"))) {
      const parent = dirname(dir);
      if (parent === dir) throw new Error("Cannot find the Cruze package root");
      dir = parent;
    }
    const manifest = JSON.parse(await readFile(join(dir, "package.json"), "utf8")) as { version: string };
    return new PackageBundle(dir, manifest.version);
  }

  async skills(): Promise<BundledSkill[]> {
    const skillsDir = join(this.root, "skills");
    const entries = await readdir(skillsDir, { withFileTypes: true });
    const folders = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
    return Promise.all(
      folders.map(async (folder) => ({ folder, files: await readTree(join(skillsDir, folder)) })),
    );
  }

  async template(path: string): Promise<string> {
    return readFile(join(this.root, "templates", path), "utf8");
  }

  async formatTemplate(name: string): Promise<string> {
    return readFile(join(this.root, "skills", "formats", "templates", name), "utf8");
  }
}

async function readTree(dir: string): Promise<BundledFile[]> {
  const entries = await readdir(dir, { withFileTypes: true, recursive: true });
  const files = entries.filter((entry) => entry.isFile()).map((entry) => join(entry.parentPath, entry.name));
  return Promise.all(
    files.sort().map(async (file) => ({
      path: relative(dir, file).split(sep).join("/"),
      text: await readFile(file, "utf8"),
    })),
  );
}
