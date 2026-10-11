# Design reviews missed how work flows, waits and recovers

- Proposal: the design reviewer's rubric gains item 11, "Flow control and recovery". It follows each message through the tasks and queues the design names and checks full queues, fairness, how async results are matched, recovery that fails, cancellation, observable values and exclusive resources. Realign runs the design reviewer with that item over features in flight.
- Evidence: usp-rs `2026-10-11-uds-mtp` rethinks at 2026-10-11T16:06 (a stalled peer's full queue held up every link), 17:09 (a `connect` under `Backoff` couldn't be matched to its link) and 18:57 (a queue bound closed a fast peer's link on a burst). Ork `2026-10-10-orchestration-runtime` at 2026-10-11T13:33 (events missed between a reconnect and its reopen). Ork `2026-10-10-network-orchestrator` at 2026-10-11T15:53 (`accept_ra` set but never observed), 16:18 (no relist after a failed resync) and 18:51 (socket reopen and failed relist unspecified). These are 7 of the 14 defect rethinks in the two projects on 0.0.8. All came after a design review, and two came from sent-back verifications.
- Asset: `skills/roles/design-reviewer.md`, "Rubric", item 11; `skills/realign/SKILL.md`, step 4; `skills/realign/notes/0.0.9.md`, `flow-control-review`

## Situation

On the console-access fixture, a feature adds a session log: the console session relays bytes through one task to every attached viewer, over one queue of 64. The delta doesn't say what the relay does when one viewer's queue is full, or what happens when the log file's writer fails and reopens.

## Expected

The design reviewer reports a blocker under "Flow control and recovery" for each gap: the full viewer queue, which holds up every other viewer and the device, and the reopen that can itself fail. Each finding names the scenario or `XC-concurrency` rule that depends on it.

## Check

Fixture run: headless `architect "session log"` up to the design review; check the reviewer's report for both findings under item 11.
