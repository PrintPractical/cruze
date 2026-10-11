# Build recorded values the design didn't give as deviations, and verify sent the change back

- Proposal: build reads a deviation back before recording it. One that names a value, text, error or outcome the design didn't give, or a promise the code can't keep, is a rethink.
- Evidence: usp-rs `2026-10-11-uds-mtp/02-uds-endpoint` T5's deviation ("a LinkUp whose peer evidence names no Endpoint ID: PORT-protocol.mtp promises one") and T14's ("a text the design does not give"). Both became code-review blockers at 2026-10-11T19:17, and verify sent the change back at 19:31. Ork `2026-10-10-network-orchestrator/02-links` T3's deviation ("the design gives the host-bits message only") is a third.
- Asset: `skills/build/SKILL.md`, "Deviations"

## Situation

On the console-access fixture, `build` for `01-local-serial` reaches T9, where the raw terminal adapter must report a failure to restore the terminal mode. The design gives no message for it.

## Expected

Build stops and offers `rethink` for the missing message, instead of recording a deviation that names the text it chose.

## Check

Fixture run: with `ADP-access.raw-terminal`'s restore failure text removed from the delta, headless `build`; check that the journal has no deviation for T9 and that the agent offered a rethink.
