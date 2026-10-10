# The break a plan names can't be written, or the test is already green

- Proposal: plan names a break as the wrong behaviour, build may use any break that compiles and turns the same assertion red, and each test goes in the task that builds what it checks.
- Evidence: rto bundle (Cruze 0.0.6 and 0.0.7): deviations at 2026-10-06T10:48 (01-notification-settings T8), 10:54 (T10), 11:01 (T12), 12:17 (T14), 16:35 (02-review-questions T3), 16:37 (T4), 16:43 (T8, test dropped as it could never fail first), 2026-10-08T10:48, 10:51, 11:42 and 11:45 (01-time-off-counts T14, T15, T17, T18). ork bundle (Cruze 0.0.7): tests that passed when written at 2026-10-07T03:16 (01-owned-status T9), 19:23 (01-run-instances T14), 19:26 (T17) and 19:27 (T18).
- Asset: skills/plan/tasks.md (step 2), skills/build/SKILL.md (task loop step 2), skills/roles/design-reviewer.md (plan rubric item 3)

## Situation

On the console-access fixture, plan a change where a use case's failure path is built by the task that builds the use case, and a later task was going to test that failure, with a synchronous operation whose test expects an empty result.

## Expected

The failure test sits in the use case's task. The break for the empty-result test is stated as a behaviour, such as "fails against a list that always shows a placeholder". Build records no deviation about a break or about a test that passed when written.

## Check

Fixture run: headless `plan` then `build`. The plan's task lines and `cruze journal list --event deviation` hold no break or already-green deviation.
