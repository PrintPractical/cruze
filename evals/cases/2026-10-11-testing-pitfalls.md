# Fakes, race tests and helpers that let defects through

- Proposal: fakes can stall and fail partway through a multi-write operation, and end the way the real adapter does; a race test is seen failing on a multi-threaded runtime and waits for a signal, never a sleep; a test is not a reason for production code; a helper a second test file needs moves to test support; memory follows storage before the next await; no `expect` on a case a caller, the clock or a race can reach; research compiles a sketch of each new call shape and runs the suite in a new test image.
- Evidence: Ork at 93cc650, `## Known pitfalls` lines 1, 2, 7, 8, 9, 10, 11 and 16.
- Asset: skills/behavioural-testing/fakes.md, skills/behavioural-testing/SKILL.md, skills/hexagonal-design/runtime.md, skills/hexagonal-design/languages/rust.md, skills/roles/code-reviewer.md (item 8), skills/research/SKILL.md (step 7)

## Situation

On the console-access fixture, build a change whose use case writes two records through a port and keeps an in-memory index of them.

## Expected

The port's fake can fail the second write and stall either one, the behaviour tests cover each partial failure, and the use case updates its index right after the durable write, before any later await.

## Check

Fixture run: headless `build`. The fake exposes the stall and partway failure, and the code review raises no finding on cancellation.
