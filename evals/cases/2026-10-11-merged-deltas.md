# A realign edit of an element the feature had merged forced a rebase of its delta

- Proposal: an element a feature merged, with its delta entry unchanged since, keeps its living text: approval needs no `--rebase`, and later lands keep the edit rather than refuse with `merge-conflict`.
- Evidence: Ork's 0.0.9 realign edited `ENT-events.area-events-derive`, which network-orchestrator's 01 had merged. `cruze next` named a rethink, and the re-stamp was refused with `rebase-required` (rethink at 2026-10-11T23:35, `found_by=check`, `missed_by=realign`).
- Asset: `src/domain/approvals/rebase.ts`, `src/domain/land/merge_plan.ts`, `skills/rethink/levels.md`, "A conflict with living text"

## Situation

On the console-access fixture, `01-local-serial` has landed, and an architecture rethink edits `ENT-access.escape-detector`, which the feature merged.

## Expected

The feature re-stamps without `--rebase`, and landing `02-ssh-hops` keeps the edit. When the feature's delta changes the element again, approval refuses with `rebase-required`.

## Check

Tests: `test/land.test.ts`, "keeps an edit someone else made to an element the feature merged, with no rebase of its delta", and "won't let a feature overwrite an element someone else changed after it merged it, when its delta changes the element again".
