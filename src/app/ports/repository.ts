/** The version-control repository the project lives in. Every operation tolerates a project outside git. */
export interface Repository {
  /** The checked-out branch, or null when detached or outside git. */
  currentBranch(): Promise<string | null>;
  /** The short hash of the checked-out commit, or null. */
  headCommit(): Promise<string | null>;
  /** Who is approving: the configured user name and email, or null. */
  userName(): Promise<string | null>;
  /** Local and remote-tracking branches other than the current one. */
  otherBranches(): Promise<string[]>;
  /** Files under a directory as they are on another branch, by project-relative path. */
  filesOnBranch(branch: string, dir: string): Promise<Map<string, string>>;
  /** The oldest commit whose change to a file added the text, or null. */
  firstCommitAdding(path: string, text: string): Promise<string | null>;
  /** A file's contents at a commit, or null when it didn't exist there. */
  fileAt(commit: string, path: string): Promise<string | null>;
}
