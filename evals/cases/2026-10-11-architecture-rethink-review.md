# An architecture rethink named a method that clashed, found only at plan

- Proposal: an architecture-level rethink that adds, renames or changes an operation, port, error or `XC` rule runs the design reviewer on the diff. Rubric item 8 checks each new name against the ones the same type or caller already reaches.
- Evidence: Ork rethink at 2026-10-11T00:26 (`api.events::<T>()` clashed with `OrkApi::events(&filter)`, E0034) after the 0.0.8 realign's architecture amendment, which had only a walkthrough. A second clash at 03:38 (two builder methods named `events`).
- Asset: `skills/rethink/levels.md`, "Architecture", step 2; `skills/rethink/SKILL.md`, "Levels"; `skills/roles/design-reviewer.md`, "Rubric", item 8

## Situation

On the console-access fixture, an architecture rethink adds an operation `open` to `PORT-access.console-link`, which `ENT-access.console-session` already names for its own transition.

## Expected

The rethink runs a design review of the diff, and the reviewer reports the clash under "Consistency" before the walkthrough.

## Check

Fixture run: headless `rethink` with that amendment; check the journal for a `review=design` round before the architecture approval.
