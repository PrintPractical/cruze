# cruze next named build after verify sent a change back for a rethink

- Proposal: a sent-back verification records `back_to=build|rethink`, and `cruze next` names `rethink` after `back_to=rethink` until a rethink is recorded, even when tasks were reopened.
- Evidence: usp-rs `2026-10-11-uds-mtp/01-uds-wire` was sent back at 2026-10-11T15:48 with reopened tasks, and `cruze next` named `build`, which the agent had to override. `02-uds-endpoint` was sent back at 18:36, and `cruze next` named `verify` "until the rethink starts".
- Asset: `src/domain/status/verification.ts`, `src/domain/status/next_step.ts`, `src/domain/journal.ts`, `skills/verify/SKILL.md`, step 10

## Situation

On the console-access fixture, `01-local-serial` is built and verify sends it back for a design change, then reopens T1.

## Expected

`cruze next` names `rethink` for the feature until a rethink is journaled, then `build`. `cruze journal add verification --set result=sent-back` without `back_to` is refused.

## Check

A test: `test/delivery.test.ts`, "names rethink after verify sends a change back for design".
