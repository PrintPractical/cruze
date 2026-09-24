---
name: cruze-behavioural-testing
description: The testing standard for a Cruze project, covering which tests to write, the seam each one drives, the ID it carries, and fakes instead of mocks. Use when writing a change's test plan, when writing, changing or fixing a test, when building a fake for a port, when deciding whether a unit test is warranted, or when reviewing tests.
---

# Behavioural testing

Behaviour is the contract. Every scenario in the specs becomes a test that drives the system through a use case and checks what a caller would see. Tests pin behaviour, not structure, so the code behind them can be rewritten freely.

## Writing tests for a task

1. Find the test plan rows whose Subject the task proves. Done when you know the seam, test file and kind of every test the task needs.
2. Write one test at its seam, carrying its subject ID. Take the inputs and expected values from the scenario's GIVEN, WHEN and THEN.
3. Run it and watch it fail for the reason you expect (red). A test that passes before the code exists proves nothing, so fix the test.
4. Write the least code that makes it pass (green). Then write the next test. Work in tracer bullets, one test and one slice of code at a time, never all the tests first.
5. Done when every test plan row whose Subject the task proves has a passing test carrying that ID, and each test fails when the behaviour it checks is removed. Tasks that prove only a `UC`, `ADP` or `MOD` are proved by the rows of the scenarios and ports they serve.

## The four kinds

These match the test plan in `.agents/skills/cruze-formats/reference/work-items.md`.

| Kind | Subject | Seam | When |
| --- | --- | --- | --- |
| `behaviour` | `SCN` | The use case's API with a fake for each driven port, or the inbound adapter when the outcome is what that adapter shows, such as CLI output, an exit code or an HTTP status | One or more per scenario, always |
| `contract` | `PORT` | The same cases run against the fake and every real adapter | Every driven port that has a real adapter |
| `domain` | `ENT` | The entity's own API | Only for real logic: state machines, calculations, invariants with edge cases |
| `smoke` | `FLOW` | The real inbound adapter, wired by the real composition root | The top 1 to 3 flows |

A behaviour test drives a use case, not a single domain type, so it keeps passing when rules move between entities. In a library with no use cases, the seam is the library's public API. Write a domain test only when a rule's edge cases are too many to reach through use cases one by one.

## Seams and fakes

- A test reaches the system only through its seam. It never calls a private function, never replaces an internal collaborator, and never inspects storage behind a port instead of reading back through the use case.
- Replace each driven port with a fake: a small in-memory implementation that honours the port's contract, such as `InMemoryDeviceCatalog`. Fake only ports, never your own domain types or use cases.
- Assert outcomes: return values, errors, and state read back through the interface. Assert calls, their count or their order only when that is itself the contract, such as hops closed in reverse order, and observe it through effects the fake records.
- Time, randomness and the environment are ports too. Inject a clock instead of reading the system time.
- A fake earns trust from the contract tests it shares with the real adapter. Read [fakes.md](fakes.md) before writing one.

## Expected values

- Take expected values from an independent source: the scenario's worked example, a spec, or a known-good literal. Never compute the expected value the way the code does.
- For a failure scenario, check both the error and the state left behind. After a refused second hop, the first hop is closed.
- Where a plausible wrong outcome exists, assert that it didn't happen.

## Protecting the check

- Behaviour, contract and smoke tests for approved scenarios, ports and flows are the safety net. Never edit one to get green. When one fails, either the code is wrong, or the spec is. A wrong spec or design goes through the rethink step, and the test changes only with the delta that changes its subject: a spec delta for a `SCN`, an architecture delta for a `PORT` or `FLOW`.
- Domain tests are disposable. Rewrite or delete them along with the code they test.
- Never skip a test, delete one, or weaken an assertion to finish a task. Verify flags any diff to a safety-net test that has no matching delta.

## What not to write

- Tests of private functions, getters or plain data.
- Tests that restate the implementation, including snapshots whose expected output was derived the same way the code derives it.
- Mocks of internal collaborators, and assertions on calls that aren't part of a contract.

Side-by-side examples are in [examples.md](examples.md).

## Naming and tracing

- Every test carries its subject ID where `.agents/skills/cruze-formats/reference/work-items.md` says, such as `// SCN-access.direct-serial` on the line above it.
- A scenario may need several tests, and each of them carries its ID. One test covers one scenario.
- `cruze trace` checks scenarios only: it fails when a scenario the change delivers has no test carrying its ID, or when a test cites a scenario nobody defined. Run it before calling a change's tests complete, and quote its result. For the `contract`, `domain` and `smoke` rows, list each subject ID next to the test that carries it.
