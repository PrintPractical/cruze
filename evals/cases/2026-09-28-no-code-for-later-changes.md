# Code is built for the next change before that change is planned

- Proposal: the code reviewer's Scope item flags a public item, variant or operation that only a later change uses, and build's green step keeps code for another change waiting for that change.
- Evidence: a code review of the mw-configuration-service repository, requested by the maintainer on 2026-09-28: `Generation::same_sets`, `GenerationHistory::get`, `UnknownGeneration`, `GenerationStore::load` and `Cause::Activation`/`FactoryReset` exist with no production caller; they serve `08-activate-and-reset`, which hasn't been planned.
- Asset: skills/roles/code-reviewer.md (rubric item 3), skills/build/SKILL.md (task loop step 3)

## Situation

On the console-access fixture, build 01-local-serial and add to `PORT-access.hop-connector`'s trait an operation that only 02-ssh-hops uses. Run `verify`.

## Expected

The code review raises a Scope finding naming the operation, and the fix removes it.

## Check

Fixture run: headless `verify` on the seeded diff. Look for a `Scope:` finding and a `fixed` disposition.
