# Tasks grow files past their budgets, forcing unplanned splits

- Proposal: in plan/tasks.md step 4, check each file a task extends against `check.maxLines` and `check.maxTypes`; when the task would take it past them, name the new file in the task.
- Evidence: mw-config-service-export.json (Cruze 0.0.1): deviations at 2026-09-25T19:09 (T18), 2026-09-26T15:45 (T1), 2026-09-26T16:01 (T4), 2026-09-27T14:17 (T2), 2026-09-27T20:55 (T10), 2026-09-27T21:08 (T12), 2026-09-27T23:13 and 23:34 (T12), 2026-09-28T14:24 (T7), 2026-09-28T16:59 (T3); discovery rethink at 2026-09-28T13:41:53.697Z.
- Asset: skills/plan/tasks.md

## Situation

On the console-access fixture, pad `src/access/app/open_console.rs` to 230 lines, then plan a change that adds two scenarios to UC-access.open-console.

## Expected

The plan names a new file for the added code, or records under `## Settled decisions` how the file is split, and build records no budget deviation.

## Check

Fixture run: headless `plan` then `build`. Look for no `deviation` whose text mentions the budget.
