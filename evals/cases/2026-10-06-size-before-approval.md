# A feature is approved with changes over the size limit

- Proposal: architect's step 12 is done only when the size warnings are gone or a decision records the user accepting them; the walkthrough lists any warning still standing, and the design reviewer reports one.
- Evidence: rbus-rs (Cruze 0.0.5): feature 2026-10-05-properties approved at 2026-10-06T01:29 while `cruze validate` warned `change-too-large` for 02-consume and 03-provide (31 scenarios each); the plan noted it at 02-consume/change.md:102 and could not split it.
- Asset: skills/architect/feature.md (step 12), skills/architect/walkthrough.md, skills/roles/design-reviewer.md (rubric item 9)

## Situation

On the console-access fixture, architect a feature whose obvious split gives one change 32 scenarios.

## Expected

Before asking for approval, the agent splits the change or asks the user to accept it, and the walkthrough names the warning if it stands.

## Check

Fixture run: headless `architect`. At the approval question, `cruze validate` reports no `change-too-large`, or the feature has a `D<n>` line accepting it and the walkthrough message names it.
