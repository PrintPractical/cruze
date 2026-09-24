/** The files of the project Cruze is working in. Paths are relative to the project root. */
export interface ProjectFiles {
  exists(path: string): Promise<boolean>;
  /** A file's text, or undefined when it doesn't exist. */
  readText(path: string): Promise<string | undefined>;
  /** Writes a file, creating parent directories as needed. */
  writeText(path: string, text: string): Promise<void>;
  /** Appends to a file, creating it and its parent directories as needed. */
  appendText(path: string, text: string): Promise<void>;
  /** Names of the entries directly inside a directory; empty when it doesn't exist. */
  listEntries(path: string): Promise<string[]>;
  /** Every file under a directory, recursively, as project-relative paths; empty when it doesn't exist. */
  listFiles(path: string): Promise<string[]>;
  /** Moves a file or directory, creating the destination's parent directories. */
  move(from: string, to: string): Promise<void>;
  /** Removes a file, a directory tree or a link (never what a link points to). */
  remove(path: string): Promise<void>;
  /** Creates a symbolic link at `path` pointing to `target`, a path relative to the link's directory. */
  link(path: string, target: string): Promise<void>;
}
