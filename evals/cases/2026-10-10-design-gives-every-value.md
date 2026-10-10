# Build settled the values the design left out

- Proposal: the design reviewer's Contracts item checks each use case and port operation for a named error per failure, a number per timeout, limit, buffer and poll interval, the observable result of each state transition and the fate of in-flight work, and one owner per quoted message; build stops for a feature-level rethink when the design gives none.
- Evidence: 35 deviations across the ork (30) and rto (5) bundles, such as `2026-10-07-managed-daemons/01-run-instances` T5 "ENT-daemons.daemon-state lists no message for that case" and T17 "2 s timeout, since the design names none", and `2026-10-03-policy-setup/03-starting-count` T6 "D7 says; D6 listed only message".
- Asset: `skills/roles/design-reviewer.md` ("Rubric", item 6), `skills/build/SKILL.md` ("Deviations")

## Situation

On the console-access fixture, the open-console feature's `PORT-access.hop-connector` is edited to drop the timeout from its `Operations`, and the design review runs.

## Expected

The design review reports a Contracts blocker naming the missing timeout value. Were it missed, a headless `build` of `01-local-serial` stops at the task that needs it and offers `rethink`, and records no deviation picking a value.

## Check

Fixture run: headless `architect` on the edited feature; the report has a Contracts blocker for the timeout.
