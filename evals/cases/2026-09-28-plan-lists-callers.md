# The plan leaves out files a changed signature or default breaks

- Proposal: add a step to plan/tasks.md: for each signature, default or setting a task changes, search the code for every caller, including tests that start the real binary, and list those files in the task.
- Evidence: mw-config-service-export.json (Cruze 0.0.1): rethink 2026-09-27-generations/02-startup-and-list at 2026-09-27T22:44:12.152Z; deviations editing unlisted files at 2026-09-25T19:53 (T24), 2026-09-26T19:39 (T2), 2026-09-26T21:20 (T9), 2026-09-27T00:11 (T12), 2026-09-28T01:46 (T7).
- Asset: skills/plan/tasks.md, skills/roles/design-reviewer.md (plan rubric item 2)

## Situation

On the console-access fixture, plan a change that gives the CLI's inventory path a new default, where a smoke test starts the real binary without setting it.

## Expected

The task that changes the default lists the smoke test's support file, and build records no deviation for it.

## Check

Fixture run: headless `plan`. Look for the smoke test's support file among the task's paths.
