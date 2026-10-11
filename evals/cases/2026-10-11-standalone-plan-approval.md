# Plan approved standalone changes by agent, and the CLI refused every time

- Proposal: plan's step 13 runs `cruze approve --by-agent` only for a feature's change. For a standalone change, which carries its own design, plan asks the user to approve it.
- Evidence: `needs-user` refusals of `approve --by-agent` in Ork sessions 87326116, 3c158c41, ea858ff6 and c3889453 (2026-10-10 and 2026-10-11, the realign prefactors), and in usp-rs 7b125f91 (2026-10-11T04:42, the walking skeleton).
- Asset: `skills/plan/SKILL.md`, step 13 and "Next step"

## Situation

On the console-access fixture, `plan` runs for the standalone walking-skeleton change.

## Expected

Plan shows the user the plan and asks them to run `cruze approve <ref>`. It never runs `--by-agent` for it.

## Check

Fixture run: headless `plan` on the walking skeleton; check the transcript has no `approve --by-agent` and the approval in `approvals.json` has no agent basis.
