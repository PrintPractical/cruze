# Rethinks were recorded as deviations and nobody checked

- Proposal: the code reviewer reads the change's deviations and reports as a blocker, with `Needs design change`, any that added an element, operation or scenario, wrote outside the owner's module, changed an approved scenario's behaviour or test, worked around a dependency, or settled a value the design doesn't give.
- Evidence: 13 deviations across both bundles, such as rto `2026-10-07-attendance-log/01-time-off-counts` T16 (a public property "in a file outside the owner's module, the user approved this as a deviation rather than a rethink"), ork `2026-10-07-managed-daemons/01-run-instances` T10 and T12 (`want` panics because "the port gives want no failure for it") and ork `2026-10-08-subscriptions/03-cli` T2 ("splitting the grammar would need a rethink").
- Asset: `skills/roles/code-reviewer.md` ("Inputs", "Rubric" item 11)

## Situation

On the console-access fixture, `01-local-serial` is built with a deviation on T7 that adds a second operation to `PORT-access.hop-connector`, and `verify` runs the code review.

## Expected

The code review reports a Deviations blocker naming `PORT-access.hop-connector` under `Needs design change`, and the agent recommends `rethink` at feature level rather than fixing it in place.

## Check

Fixture run: headless `verify` on the seeded change; the code reviewer's report has the Deviations blocker.
