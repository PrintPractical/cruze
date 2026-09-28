# A task adds code its first user adds later, and the lint rejects it

- Proposal: in plan/tasks.md, when the project's lint command rejects unused code, put each new item in the task of its first user.
- Evidence: mw-config-service-export.json (Cruze 0.0.1): deviations at 2026-09-25T19:02 (T11 with T12), 2026-09-27T02:38 (08-reconnect T2), 2026-09-27T22:16 (02-startup-and-list T4), 2026-09-28T17:02 (05-durability T4).
- Asset: skills/plan/tasks.md

## Situation

On the console-access fixture, with `commands.lint` set to `cargo clippy -- -D warnings`, plan a change where a domain type gains a method that only a use case two tasks later calls.

## Expected

The method is in the use case's task, or the earlier task's test calls it. Build commits each task alone without a deviation.

## Check

Fixture run: headless `plan`. Look at the task that first writes the method and check that its test or its owner uses it.
