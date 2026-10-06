# A test that expects a default passes against the stub

- Proposal: plan names, in the task, the break a test expecting a default or empty result is first seen failing against.
- Evidence: rto journals (Cruze 0.0.5): deviations "first seen failing against a break" at 2026-10-05T19:45 (T9), 19:56 (T12), 20:27 (T14) and 23:06 (02-burn-up-chart T1); plan review finding "D11 names no failing first run" at 2026-10-04T22:25.
- Asset: skills/plan/tasks.md (step 2)

## Situation

On the console-access fixture, plan a change with a scenario whose THEN is that the device list prints nothing when no devices are configured.

## Expected

The task that proves the scenario names the break it is first seen failing against, such as a list that always prints one placeholder device.

## Check

Fixture run: headless `plan`. The task line for the scenario names a break.
