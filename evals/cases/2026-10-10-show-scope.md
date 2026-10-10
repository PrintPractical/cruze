# The architecture and the feature were read whole at every step

- Proposal: `cruze show <ref>` prints the elements a change builds, the scenarios it delivers, what they cite with where it sits, the decisions and the ledger; plan, build, the design reviewer, the code reviewer and the verifier read it instead of `docs/architecture.md` and `feature.md` whole.
- Evidence: rto transcripts read `docs/architecture.md` (46,857 words) whole 151 times and feature files (up to 11,856 words) 199 times; ork read its architecture (40,086 words) 186 times and feature files (up to 21,831 words) 187 times. Agents edited the architecture through ad hoc Python scripts 261 times in rto rather than load it.
- Asset: `src/domain/project/scope_view.ts`, `src/app/use_cases/show_scope.ts`, `skills/plan/SKILL.md` step 6, `skills/build/SKILL.md` step 3, `skills/roles/design-reviewer.md`, `skills/roles/code-reviewer.md`, `skills/roles/verifier.md`

## Situation

On the console-access fixture, `build` starts `01-local-serial`.

## Expected

`cruze show 2026-09-25-open-console/01-local-serial` lists `ENT-access.escape-detector` with its `ADDED` body from the feature and `UC-inventory.find-device` from `docs/architecture.md`, the five delivered scenarios, `ENT-inventory.console-path` as cited with its line, decision D2 and the dispositions. The build transcript reads that output and never `cat`s or reads `docs/architecture.md` whole.

## Check

A test: `test/show.test.ts`. Fixture run: headless `build` on `01-local-serial`; the transcript has `cruze show` and no whole read of `docs/architecture.md`.
