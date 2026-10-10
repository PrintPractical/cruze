# Reviewers listed every disposition ever recorded

- Proposal: the settled ledger is the item's, read with `cruze journal list --event disposition --item <ref>`; `journal list` lists the work in flight by default and landed work only with `--all`; `cruze status` JSON drops the approval hashes.
- Evidence: rto reviewer subagents ran `cruze journal list --event disposition` unscoped 75 times (53 unpiped), the main sessions 75 times; ork 74 and 57. The listing was 145,279 bytes in rto and 141,422 in ork, about 36k tokens. `cruze status --json` was 20,864 bytes in rto and 54,637 in ork, run 209 and 118 times.
- Asset: `src/app/use_cases/journal_events.ts`, `src/adapters/inbound/cli/commands/status.ts`, `skills/roles/SKILL.md` ("The settled ledger"), `skills/roles/design-reviewer.md`, `skills/roles/code-reviewer.md`, `skills/land/SKILL.md` step 7, `skills/roles/surveyor.md`

## Situation

On the console-access fixture, with a disposition recorded on the archived walking skeleton, one on the project and one on `01-local-serial`, the design reviewer gathers its inputs for `01-local-serial`'s plan review.

## Expected

The reviewer runs `cruze journal list --event disposition --item 2026-09-25-open-console/01-local-serial` and sees that change's entry only. `cruze journal list --event disposition` lists the project's and the in-flight entry; `--all` adds the archived one. `cruze status --json` has no `record` with hashes.

## Check

A test: `test/journal.test.ts`, "lists the project's and the work in flight's entries by default", and `test/cli.test.ts` for the status JSON. Fixture run: headless `plan` on `01-local-serial`; the reviewer subagent's transcript has no unscoped `journal list`.
