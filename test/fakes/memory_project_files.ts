import { posix } from "node:path";
import type { ProjectFiles } from "../../src/app/ports/project_files.ts";

/** Project files held in memory: files by path, links by path to their target. */
export class MemoryProjectFiles implements ProjectFiles {
  readonly files = new Map<string, string>();
  readonly links = new Map<string, string>();

  constructor(initial: Record<string, string> = {}) {
    for (const [path, text] of Object.entries(initial)) this.files.set(path, text);
  }

  async exists(path: string): Promise<boolean> {
    return this.files.has(path) || this.links.has(path) || this.paths().some((p) => p.startsWith(`${path}/`));
  }

  async writeText(path: string, text: string): Promise<void> {
    this.files.set(path, text);
  }

  async listEntries(path: string): Promise<string[]> {
    const prefix = `${path}/`;
    const names = this.paths()
      .filter((p) => p.startsWith(prefix))
      .map((p) => p.slice(prefix.length).split("/")[0] ?? "");
    return [...new Set(names)].sort();
  }

  async remove(path: string): Promise<void> {
    for (const store of [this.files, this.links]) {
      for (const key of [...store.keys()]) {
        if (key === path || key.startsWith(`${path}/`)) store.delete(key);
      }
    }
  }

  async link(path: string, target: string): Promise<void> {
    await this.remove(path);
    this.links.set(path, target);
  }

  /** The file a link resolves to, following it like the filesystem would. */
  readThroughLink(linkPath: string, file: string): string | undefined {
    const target = this.links.get(linkPath);
    if (target === undefined) return undefined;
    return this.files.get(posix.join(posix.dirname(linkPath), target, file));
  }

  private paths(): string[] {
    return [...this.files.keys(), ...this.links.keys()];
  }
}
