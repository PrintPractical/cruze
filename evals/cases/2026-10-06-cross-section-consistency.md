# Design review misses contradictions between sections

- Proposal: the design reviewer checks each XC rule against the others and the layer rules, use cases that change the same state for interleavings, and at feature scope, architecture prose the delta makes untrue.
- Evidence: rethinks (Cruze 0.0.5): rto 2026-10-05T03:33 (XC-logging's os.Logger against XC-build's import rules, missed_by design-review) and 13:15 (restore and edit office interleave, missed_by design-review); rbus-rs 2026-10-06T01:55 (Overview and D2 still named one port after a feature split it).
- Asset: skills/roles/design-reviewer.md (rubric item 8)

## Situation

On the console-access fixture, add an XC rule that every adapter logs through the standard logger, while the layer rules forbid adapters importing it.

## Expected

The design review reports a Consistency finding naming both rules.

## Check

Fixture run: the design reviewer role on the edited architecture. Its report has the finding.
