# The verifier drove every scenario and slept through timers

- Proposal: the verifier runs only the scenarios whose test-plan seam is an inbound adapter, a screen or a real adapter, quotes the behaviour test at the checks commit for the rest, and treats a wait over 30 seconds as `could not run`.
- Evidence: rto transcripts: 28 verifier subagents averaging 31 minutes and 9.1M input tokens; their shell time was 3.7 hours of `sleep` (71 sleeps averaging 188 seconds), 2.7 hours of `xcodebuild test` and 0.8 hours of `simctl`. One verification of 28 was sent back (2026-10-03T20:07). Ork's 16 verifier runs averaged 7.7 minutes.
- Asset: `skills/roles/verifier.md` ("Inputs", "Work" step 3, the time rule)

## Situation

On the console-access fixture, `verify` runs the verifier for `01-local-serial`, whose test plan has four scenarios through `UC-access.open-console` with fakes and one through `ADP-system.cli`.

## Expected

The verifier's report runs `SCN-access.unknown-device-suggestion` through the binary, and for the other four gives the behaviour test's file and name as `Ran:` and the checks commit as `Observed:`. No `sleep` longer than 30 seconds appears in its transcript.

## Check

Fixture run: headless `verify` on `01-local-serial`; check the report blocks and the verifier subagent's shell commands.
