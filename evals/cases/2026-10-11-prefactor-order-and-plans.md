# A realign prefactor landed after a feature that hadn't started, and its plan improvised a safety net

- Proposal: the roadmap puts a prefactor before the items it overlaps, unless one is building, and realign asks the order. A prefactor's plan adds no behaviour rows, names the existing tests that reach each rebuilt element under `## Risks`, and keeps visibility as it was; the plan rubric's Prefactor item checks it, and build runs those tests in place of a red step.
- Evidence: Ork's 0.0.9 realign put `realign-budget-merges` in phase 6, after `secrets`, whose design was approved but unplanned; the user wanted the prefactor first, against `cruze next`. Its plan needed a settled decision ("no test added or edited; these suites must pass unchanged"), and its review's only finding was visibility left wider than needed.
- Asset: `skills/roadmap/SKILL.md`, "Adding an item", `skills/realign/SKILL.md`, step 6, `skills/plan/SKILL.md`, "A prefactor", `skills/roles/design-reviewer.md`, "Plan rubric", item 7, `skills/build/SKILL.md`

## Situation

A project realigns with one feature designed but not planned, whose module a prefactor restructures, and then plans that prefactor.

## Expected

Realign asks the order and recommends the prefactor first, blocking the feature on it. The prefactor's plan has no behaviour rows, lists the existing tests and their command under `## Risks`, and no task widens an item's visibility beyond its new callers' needs.

## Check

A fixture run, by hand: realign the console-access fixture with a prefactor over `MOD-access.domain`, then plan it, and read the roadmap and the plan.
