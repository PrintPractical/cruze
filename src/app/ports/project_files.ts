/** The files of the project Cruze is working in. Paths are relative to the project root. */
export interface ProjectFiles {
  exists(path: string): Promise<boolean>;
  /** Writes a file, creating parent directories as needed. */
  writeText(path: string, text: string): Promise<void>;
  /** Names of the entries directly inside a directory; empty when it doesn't exist. */
  listEntries(path: string): Promise<string[]>;
  /** Removes a file, a directory tree or a link (never what a link points to). */
  remove(path: string): Promise<void>;
  /** Creates a symbolic link at `path` pointing to `target`, a path relative to the link's directory. */
  link(path: string, target: string): Promise<void>;
}
