# Nits are listed and brought to the user

- Proposal: reviewers give nits as a number only, nits get no disposition, and a feature's design review may list one concern per 5 scenarios in its spec delta.
- Evidence: ork bundle (Cruze 0.0.7): 38 nit dispositions, including 5 rejected by the user at 2026-10-08T13:40:26-27 (2026-10-07-generation-control design) and 4 waived at 2026-10-09T02:49:05 (2026-10-08-subscriptions design); the reviewer report in that session lists them under "Nits, not listed:". 19 of 32 first-round design reviews across both bundles hit the 5-concern cap.
- Asset: skills/roles/SKILL.md (Round 1, step 3), skills/roles/design-reviewer.md and skills/roles/code-reviewer.md (Findings)

## Situation

On the console-access fixture, run a design review of a feature with about 30 scenarios in its spec delta, where the design has several cosmetic problems.

## Expected

The report gives nits as a count only, may list up to 6 concerns, and `cruze journal list --event disposition` has no entry whose finding starts with `Nit`.

## Check

Fixture run: headless `architect` through its design review. Check the report and the disposition entries.
