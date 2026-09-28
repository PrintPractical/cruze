# Rethink entries don't say which step missed the defect in a form a retro can count

- Proposal: `cruze journal add rethink` replaces free-text `caught_by` with `found_by`, and a defect also needs `missed_by`, both from a fixed list of steps; the CLI records `round`, `blockers`, `concerns` and `nits` as numbers.
- Evidence: mw-config-service-export.json (Cruze 0.0.1): all 17 rethinks write `caught_by` as free text like "X should have caught it; Y found it"; all 61 review entries store numbers as strings.
- Asset: src/domain/journal.ts, src/app/use_cases/journal_events.ts, skills/rethink/SKILL.md, skills/roles/SKILL.md

## Situation

On the console-access fixture, record a defect rethink without `missed_by`, then one with `missed_by=the reviewer`, then one with `missed_by=design-review`, then a review round with `blockers=2`.

## Expected

The first two are refused with `invalid-event`. The third is recorded. The review entry holds `blockers: 2` as a number.

## Check

Tests in `test/journal.test.ts`: "asks a defect rethink which step missed it, from the steps a retro counts" and "records review counts as numbers, and refuses counts that aren't".
