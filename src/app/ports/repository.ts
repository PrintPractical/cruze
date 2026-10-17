/** The version-control repository the project lives in. Every operation tolerates a project outside git. */
export interface Repository {
  /** Who is approving: the configured user name and email, or null. */
  userName(): Promise<string | null>;
}
