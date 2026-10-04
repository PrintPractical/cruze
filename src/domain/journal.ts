/** The append-only journal: one JSON object per line, written only by the CLI. */

export interface JournalEntry {
  at: string;
  event: string;
  by: string;
  [field: string]: unknown;
}

/** Events other tools and skills record, with the fields each requires. */
export const RECORDED_EVENTS: Record<string, string[]> = {
  rethink: ["level", "kind", "summary", "wrong", "found_by"],
  disposition: ["finding", "disposition", "reason", "review"],
  review: ["review", "round", "blockers", "concerns"],
  override: ["gate", "reason"],
  bug: ["summary", "cause"],
  verification: ["result", "summary"],
};

/** Fields an event may carry beyond its required ones, checked when present. A defect rethink must say which step missed it. */
const OPTIONAL_FIELDS: Record<string, string[]> = {
  rethink: ["missed_by"],
  review: ["nits"],
  disposition: ["decided"],
};

/** The workflow steps and checks that find or miss a problem, so a retro can count them. */
export const STEPS = ["envision", "architect", "research", "design-review", "walkthrough", "plan", "plan-review", "build", "code-review", "verify", "land", "realign", "validate", "check", "user"];

export const FIELD_VALUES: Record<string, string[]> = {
  level: ["task", "change", "feature", "architecture", "vision"],
  kind: ["defect", "discovery"],
  disposition: ["fixed", "waived", "deferred", "rejected"],
  decided: ["agent", "user"],
  review: ["design", "plan", "code", "realign"],
  result: ["accepted", "sent-back"],
  found_by: STEPS,
  missed_by: STEPS,
};

/** Fields recorded as numbers rather than text. */
const COUNT_FIELDS = ["round", "blockers", "concerns", "nits"];

export function journalPath(folder: string): string {
  return `${folder}/journal.jsonl`;
}

export function parseJournal(text: string | undefined): { entries: JournalEntry[]; badLines: number[] } {
  const entries: JournalEntry[] = [];
  const badLines: number[] = [];
  (text ?? "").split("\n").forEach((line, index) => {
    if (line.trim() === "") return;
    try {
      const entry = JSON.parse(line) as JournalEntry;
      if (typeof entry.event === "string" && typeof entry.at === "string") entries.push(entry);
      else badLines.push(index + 1);
    } catch {
      badLines.push(index + 1);
    }
  });
  return { entries, badLines };
}

export function serializeEntry(entry: JournalEntry): string {
  return `${JSON.stringify(entry)}\n`;
}

/** Problems with an event a caller asks to record; empty when it can be recorded. */
export function recordedEventProblems(event: string, fields: Record<string, string>): string[] {
  const required = RECORDED_EVENTS[event];
  if (required === undefined) return [`unknown event "${event}"; recordable events: ${Object.keys(RECORDED_EVENTS).join(", ")}`];
  const needed = event === "rethink" && fields["kind"] === "defect" ? [...required, "missed_by"] : required;
  const problems = needed.filter((field) => (fields[field] ?? "").trim() === "").map((field) => `${event} needs ${field}${field === "missed_by" ? " for a defect" : ""}`);
  const known = [...required, ...(OPTIONAL_FIELDS[event] ?? [])];
  for (const field of known) {
    const value = fields[field];
    if (value === undefined) continue;
    const allowed = FIELD_VALUES[field];
    if (allowed !== undefined && !allowed.includes(value)) problems.push(`${field} must be one of ${allowed.join(", ")}`);
    if (COUNT_FIELDS.includes(field) && !/^\d+$/.test(value)) problems.push(`${field} must be a whole number`);
  }
  if (event === "disposition" && fields["decided"] === "agent" && fields["disposition"] !== "fixed") {
    problems.push("the agent decides only fixes; the user waives, defers or rejects a finding (decided=user)");
  }
  return problems;
}

/** The fields as the journal stores them: counts become numbers. */
export function recordedFields(fields: Record<string, string>): Record<string, string | number> {
  return Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, COUNT_FIELDS.includes(key) ? Number(value) : value]));
}
