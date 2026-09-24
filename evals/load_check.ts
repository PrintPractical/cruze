/**
 * Load test for a workflow skill: did a run read every knowledge file the skill names?
 *
 *   node evals/load_check.ts <skill folder> <transcript.jsonl> [more transcripts...]
 *
 * Pass the session's transcript and its subagent transcripts. Prints a JSON report
 * and exits 1 when a named file was never loaded.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { loadReport } from "./load_check/load_report.ts";
import { skillFilesRead } from "./load_check/transcript_reads.ts";

const [skillFolder, ...transcripts] = process.argv.slice(2);
if (skillFolder === undefined || transcripts.length === 0) {
  process.stderr.write("usage: node evals/load_check.ts <skill folder> <transcript.jsonl> [more transcripts...]\n");
  process.exit(2);
}

const read = new Set(transcripts.flatMap((path) => [...skillFilesRead(readFileSync(path, "utf8"))]));
const report = loadReport(readFileSync(join(skillFolder, "SKILL.md"), "utf8"), read);
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
process.exit(report.passed ? 0 : 1);
