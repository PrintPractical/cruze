import { parseApprovals, type ApprovalsFile } from "../approvals/records.ts";
import { parseConfig, type ConfigResult } from "../config.ts";
import { journalPath, parseJournal, type JournalEntry } from "../journal.ts";
import { PATHS, type Snapshot } from "./layout.ts";
import { buildLivingModel, type LivingModel } from "./living_model.ts";
import { readDelta } from "./deltas.ts";
import { listWorkItems, type WorkItem } from "./work_items.ts";

/** Everything the rules need, loaded once from a snapshot. */
export interface ProjectView {
  snapshot: Snapshot;
  living: LivingModel;
  items: WorkItem[];
  config: ConfigResult | null;
  /** Approvals by the folder (or `.cruze` for project documents) that holds them. */
  approvals: Map<string, ApprovalsFile>;
  /** Problems reading approvals files, by path. */
  approvalProblems: Map<string, string>;
  /** IDs retired by archived work: never to be reused. */
  retired: Set<string>;
  /** Every journal entry in the project, oldest first. */
  journal: JournalEntry[];
  /** Journal lines that are not valid entries, by path. */
  journalProblems: Map<string, number[]>;
}

export function buildProjectView(snapshot: Snapshot): ProjectView {
  const items = listWorkItems(snapshot);
  const approvals = new Map<string, ApprovalsFile>();
  const approvalProblems = new Map<string, string>();
  for (const folder of [".cruze", ...items.map((item) => item.folder)]) {
    const path = approvalsPath(folder);
    const { file, problem } = parseApprovals(snapshot.get(path));
    approvals.set(folder, file);
    if (problem !== undefined) approvalProblems.set(path, problem);
  }
  const retired = new Set(
    items
      .filter((item) => item.archived)
      .flatMap((item) => readDelta(item.doc).entries.filter((e) => e.element.op === "REMOVED").map((e) => e.element.id)),
  );
  const journal: JournalEntry[] = [];
  const journalProblems = new Map<string, number[]>();
  for (const folder of [".cruze", ...items.map((item) => item.folder)]) {
    const path = journalPath(folder);
    const { entries, badLines } = parseJournal(snapshot.get(path));
    journal.push(...entries);
    if (badLines.length > 0) journalProblems.set(path, badLines);
  }
  journal.sort((a, b) => a.at.localeCompare(b.at));
  const configText = snapshot.get(PATHS.config);
  return {
    snapshot,
    living: buildLivingModel(snapshot),
    items,
    config: configText === undefined ? null : parseConfig(configText),
    approvals,
    approvalProblems,
    retired,
    journal,
    journalProblems,
  };
}

export function approvalsPath(folder: string): string {
  return `${folder}/approvals.json`;
}

/** The folder that holds an artifact's approval: the work item's folder, or `.cruze` for project documents. */
export function approvalFolder(view: ProjectView, artifactPath: string): string {
  return view.items.find((item) => item.path === artifactPath)?.folder ?? ".cruze";
}
