/** The append-only journal: one JSON object per line, written only by the CLI. */

export interface JournalEntry {
  at: string;
  event: string;
  by: string;
  [field: string]: unknown;
}

/** Events other tools and skills record, with the fields each requires. */
export const RECORDED_EVENTS: Record<string, string[]> = {
  rethink: ["level", "kind", "summary", "wrong", "caught_by"],
  disposition: ["finding", "disposition", "reason", "review"],
  review: ["review", "round", "blockers", "concerns"],
  override: ["gate", "reason"],
  bug: ["summary", "cause"],
  verification: ["result", "summary"],
};

export const FIELD_VALUES: Record<string, string[]> = {
  level: ["task", "change", "feature", "architecture", "vision"],
  kind: ["defect", "discovery"],
  disposition: ["fixed", "waived", "deferred", "rejected"],
  review: ["design", "plan", "code"],
  result: ["accepted", "sent-back"],
};

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
  const problems = required.filter((field) => (fields[field] ?? "").trim() === "").map((field) => `${event} needs ${field}`);
  for (const [field, allowed] of Object.entries(FIELD_VALUES)) {
    const value = fields[field];
    if (value !== undefined && required.includes(field) && !allowed.includes(value)) problems.push(`${field} must be one of ${allowed.join(", ")}`);
  }
  return problems;
}
