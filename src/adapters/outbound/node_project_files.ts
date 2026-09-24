import { lstat, mkdir, readdir, rm, symlink, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve } from "node:path";
import type { ProjectFiles } from "../../app/ports/project_files.ts";

/** Project files on the local disk, confined to one root directory. */
export class NodeProjectFiles implements ProjectFiles {
  private readonly root: string;

  constructor(root: string) {
    this.root = resolve(root);
  }

  async exists(path: string): Promise<boolean> {
    try {
      await lstat(this.resolve(path));
      return true;
    } catch (error) {
      if (isNotFound(error)) return false;
      throw error;
    }
  }

  async writeText(path: string, text: string): Promise<void> {
    const target = this.resolve(path);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, text, "utf8");
  }

  async listEntries(path: string): Promise<string[]> {
    try {
      return (await readdir(this.resolve(path))).sort();
    } catch (error) {
      if (isNotFound(error)) return [];
      throw error;
    }
  }

  async remove(path: string): Promise<void> {
    await rm(this.resolve(path), { recursive: true, force: true });
  }

  async link(path: string, target: string): Promise<void> {
    const linkPath = this.resolve(path);
    this.assertInsideRoot(resolve(dirname(linkPath), target));
    await mkdir(dirname(linkPath), { recursive: true });
    await rm(linkPath, { recursive: true, force: true });
    await symlink(target, linkPath, "dir");
  }

  /** Resolves a project-relative path, refusing anything outside the root. */
  private resolve(path: string): string {
    const absolute = resolve(this.root, path);
    this.assertInsideRoot(absolute);
    return absolute;
  }

  private assertInsideRoot(absolute: string): void {
    const fromRoot = relative(this.root, absolute);
    if (fromRoot.startsWith("..") || isAbsolute(fromRoot)) {
      throw new Error(`Path escapes the project root: ${absolute}`);
    }
  }
}

function isNotFound(error: unknown): boolean {
  return error instanceof Error && "code" in error && error.code === "ENOENT";
}
