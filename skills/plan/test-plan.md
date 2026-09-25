# Writing the test plan

The test plan decides, before any code, which test proves each scenario and at which seam. The row format is in `.agents/skills/cruze-formats/reference/work-items.md`, and the four kinds are defined in `.agents/skills/cruze-behavioural-testing/SKILL.md`.

1. **One `behaviour` row per delivered scenario.**
   - The seam is the use case that serves the scenario's requirement, with a fake named for each driven port it uses.
   - When the outcome is what an inbound adapter shows, such as CLI output, an exit code or an HTTP status, the seam is that adapter instead, run for real.
   - Two scenarios may share a test file, but each gets its own row.
2. **One `contract` row per port that a built adapter implements.** The seam names the fake and each real adapter, and what stands in for the outside world: a temporary directory, a pseudo-terminal, a local test server.
3. **A `domain` row only for real logic.** Add one for a state machine, a calculation, or an invariant with many edge cases, when reaching every case through use cases would take many tests.
4. **A `smoke` row for each flow the change completes,** when that flow is one of the system's top 1 to 3. It runs the real inbound adapter wired by the real composition root.
5. **Test file paths follow the language's conventions.** Put behaviour, contract and smoke tests where the language keeps tests that use the public API, such as `tests/` in Rust. Put domain tests where it keeps unit tests.

Done when every delivered scenario has a `behaviour` row, every port a built adapter implements has a `contract` row, and every test file path is a real path the project's test runner will find.
