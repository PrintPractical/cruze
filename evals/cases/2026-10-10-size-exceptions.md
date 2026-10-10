# Accepted size warnings never cleared, and one went on to 26 deviations

- Proposal: `changes.exceptions` in `.cruze/config.yaml` records the user's acceptance with its reason and silences the warning; `cruze approve` refuses an item whose size warning still stands (`size-unaccepted`).
- Evidence: ork feature decisions D34, D35 and D39 (2026-10-10) record the user accepting 33, 33 and 51 scenarios; every `cruze validate` run in ork reported the same three `change-too-large` warnings after. Ork `2026-10-07-managed-daemons/01-run-instances` had 28 tasks, over 25, and recorded 26 deviations (2026-10-07T18:23 to 2026-10-07T21:00).
- Asset: `src/domain/config.ts`, `src/domain/validation/size_rules.ts`, `src/app/use_cases/approve_artifact.ts`, `skills/architect/feature.md` step 12, `skills/plan/SKILL.md` step 13

## Situation

On the console-access fixture, with `changes.min_builds` removed so `02-ssh-hops` warns `change-too-small`, the user approves the open-console feature and accepts the small change.

## Expected

`cruze approve 2026-09-25-open-console` refuses with `size-unaccepted` and names `changes.exceptions`. After `02-ssh-hops` is listed there with the reason, `cruze validate` reports no warning and the approval succeeds. A plan over `changes.max_tasks` is refused the same way by the change's ref.

## Check

A test: `test/sizes.test.ts`.
