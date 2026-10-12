# cruze next named only IDs for stale work, and couldn't say a rebase was coming

- Proposal: `cruze diff <ref>` shows each changed upstream element's approved and current text, and the elements whose rebase the delta needs; `cruze next` says whether a re-stamp or a rebase is due.
- Evidence: in Ork, `cruze next` sent network-orchestrator to a rethink for two merged file lists that changed no behaviour, calling it a re-stamp; approval then refused with `rebase-required`.
- Asset: `src/app/use_cases/upstream_diff.ts`, `src/domain/status/next_step.ts`, `skills/rethink/SKILL.md`, step 6, `skills/land/SKILL.md`, step 3

## Situation

On the console-access fixture, with the design approved and committed, an architecture rethink edits an element the feature's delta modifies, or one it already merged.

## Expected

`cruze diff` shows the edited line removed and added, with no status lines, and names the rebase only for the element the delta still changes. `cruze next` says "rebase it" or "re-stamp it" to match. Without a commit holding the approval, it says so rather than guess.

## Check

Tests: `test/upstream_diff.test.ts`, and `test/git_repository.test.ts`, "finds the commit that first added a text to a file, and reads a file as it was there".
