# Build writes private test helpers that code review then moves

- Proposal: the test support module is in every test-writing task's scope. Build extends it as a recorded deviation instead of stopping for a rethink, and plan lists the support files a task extends.
- Evidence: rto journals (Cruze 0.0.5): deviations moving private helpers into shared test support after code review at 2026-10-05T00:54 (02-tracking-access T8), 07:55 (03-detect-office-days T12), 15:49 (04-office-changes-and-reevaluation T4) and 21:31 (01-progress-and-week T13).
- Asset: skills/build/SKILL.md ("Deviations"), skills/plan/tasks.md (step 3)

## Situation

On the console-access fixture, build a task whose tests need a configuration builder that `tests/support/` almost has, missing one field.

## Expected

Build adds the field to the shared builder in `tests/support/`, records a deviation, and writes no helper in the task's test file.

## Check

Fixture run: headless `build` of the task. The diff touches `tests/support/`, the test file defines no builder of its own, and the journal has one deviation for the task.
