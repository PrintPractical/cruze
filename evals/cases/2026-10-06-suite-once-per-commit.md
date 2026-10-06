# The full test suite runs several times on the same commit

- Proposal: build records the commit where its checks passed (`cruze journal add checks`), verify quotes it when no code changed since, the verifier doesn't rerun the suite, verify reruns it once after code-review fixes, and land leaves it to CI after a clean merge. `test_full` lets a slow tier run once per change.
- Evidence: rto transcripts (Cruze 0.0.5): full runs of about 25 minutes at 2026-10-05T20:58, 21:22, 21:31 and, in the verifier, 21:55 for `01-progress-and-week`; at 23:17, 23:43, 2026-10-06T00:09 (verifier) and 00:55 for `02-burn-up-chart`. Package tests alone took 0.8 minutes.
- Asset: skills/build/SKILL.md, skills/verify/SKILL.md, skills/roles/verifier.md, skills/land/SKILL.md, skills/formats/reference/config.md

## Situation

On the console-access fixture, with a change whose tasks are all ticked and nothing built since, run `build`'s finish step and then `verify` in a new session.

## Expected

The full suite runs once, at build's finish, and `cruze journal list --event checks --item <ref>` shows that commit. Verify quotes the entry instead of running the test command, and the verifier's report names that commit and runs no full suite.

## Check

Fixture run: headless `build` then `verify`. Count the test-command invocations in both transcripts and the verifier's: exactly one before any code-review fix.
