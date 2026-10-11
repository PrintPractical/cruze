# Defect rethinks named architect where the design review's rubric owned the gap

- Proposal: when a design review ran over the element and a rubric item covers the gap, the rethink records `missed_by=design-review`. The rethink skill's step list includes `realign`.
- Evidence: 7 of Ork's 8 defect rethinks on 0.0.8 record `missed_by=architect`, including gaps that design-reviewer item 6 covers (2026-10-11T04:06, 14:27, 16:18). usp-rs records the same kind of gap as `design-review` (2026-10-11T16:06 to 18:57). RTO's realign rethink at 2026-10-11T14:17 recorded `found_by=improve` because the skill didn't list `realign`.
- Asset: `skills/rethink/SKILL.md`, step 7

## Situation

On the console-access fixture, after a design review, build finds that `PORT-access.hop-connector` gives no timeout, and offers a rethink.

## Expected

The rethink entry records `kind=defect`, `found_by=build` and `missed_by=design-review`, naming rubric item 6.

## Check

Fixture run: headless `rethink` from that point; check the journal's rethink entry.
