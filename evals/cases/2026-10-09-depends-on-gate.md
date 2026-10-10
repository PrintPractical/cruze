# A change is built before the change it depends on has landed

- Proposal: the build gate refuses a change until every change in its `Depends on` has landed on the branch.
- Evidence: rto bundle (Cruze 0.0.7): rethink at 2026-10-09T00:44:23 on 2026-10-07-attendance-log ("T1-T12 were built before 02, and cruze 0.0.7's build gate never reads Depends on").
- Asset: src/domain/status/work_status.ts (`buildGateReasons`)

## Situation

On the console-access fixture, with the design approved, change 02-ssh-hops (which depends on 01-local-serial) is approved on its own branch before 01-local-serial has landed, and build runs `cruze status --gate build`.

## Expected

The gate is blocked, naming 01-local-serial as a dependency that hasn't landed here, and saying to land it and merge main into the branch.

## Check

Test: `test/approvals.test.ts`, "blocks building a change until every change it depends on has landed".
