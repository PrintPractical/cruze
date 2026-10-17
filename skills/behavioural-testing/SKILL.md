---
name: cruze-behavioural-testing
description: The testing standard for a Cruze project, covering which tests to write, the seam each one drives, the ID it carries, and fakes instead of mocks. Use when writing, changing or fixing a test, when building a fake for a port, when deciding whether a unit test is warranted, or when reviewing tests.
---

# Behavioural testing

Behaviour is the contract. Every scenario in a feature becomes a test that drives the system through a use case and checks what a caller would see. Tests pin behaviour, not structure, so the code behind them can be rewritten freely.

## Writing tests for a feature

1. For each scenario, pick its seam from the table below. Done when you know the seam, test file and kind of every test the feature needs.
2. Write one test at its seam, carrying the scenario's ID. Take the inputs and expected values from the scenario's GIVEN, WHEN and THEN.
3. Run it and watch it fail for the reason you expect (red). A test that passes before the code exists proves nothing, so fix the test. A test that guards a race or an ordering must be seen failing against code that has the flaw: run the racing work concurrently, on a multi-threaded runtime where there is one, and wait for a signal the system gives, such as a watch having opened, never for a fixed sleep.
4. Write the least code that makes it pass (green). Then write the next test. Work in tracer bullets, one test and one slice of code at a time, never all the tests first.
5. Done when every scenario has a passing test carrying its ID, every port with a real adapter has contract tests, and each test fails when the behaviour it checks is removed.

## The four kinds

| Kind | Subject | Seam | When |
| --- | --- | --- | --- |
| `behaviour` | a scenario | The use case's API with a fake for each driven port, or the inbound adapter when the outcome is what that adapter shows, such as CLI output, an exit code or an HTTP status | One or more per scenario, always |
| `contract` | a port | The same cases run against the fake and every real adapter | Every driven port that has a real adapter |
| `domain` | a domain type | The entity's own API | Only for real logic: state machines, calculations, invariants with edge cases |
| `smoke` | the main path | The real inbound adapter, wired by the real composition root | The top 1 to 3 paths through the system |

A behaviour test drives a use case, not a single domain type, so it keeps passing when rules move between entities. In a library with no use cases, the seam is the library's public API. Write a domain test only when a rule's edge cases are too many to reach through use cases one by one.

## Seams and fakes

- A test reaches the system only through its seam. It never calls a private function, never replaces an internal collaborator, and never inspects storage behind a port instead of reading back through the use case.
- Replace each driven port with a fake: a small in-memory implementation that honours the port's contract, such as `InMemoryDeviceCatalog`. Fake only ports, never your own domain types or use cases.
- Assert outcomes: return values, errors, and state read back through the interface. Assert calls, their count or their order only when that is itself the contract, such as hops closed in reverse order, and observe it through effects the fake records.
- Time, randomness and the environment are ports too. Inject a clock instead of reading the system time.
- A fake earns trust from the contract tests it shares with the real adapter. Read [fakes.md](fakes.md) before writing one.

## Test support

- Share fixtures and harnesses the way you share fakes. Keep one builder or constant for each domain value tests keep needing, such as a valid configuration or an ID from a string, and one harness per seam, such as an in-process service or the real binary started on a temporary directory. They live in the test support module the language file names.
- Before writing a helper in a test file, look in the test support module and in the test binary's other files. Use or extend what is there, and never redefine it. When a second test file needs a helper, move it into the test support module then, and use it from both.
- Split a test file by the behaviour it covers, one use case, port or flow per file. File budgets apply to source, not to tests, so never split a test file to meet one.

## Expected values

- Take expected values from an independent source: the scenario's worked example, a spec, or a known-good literal. Never compute the expected value the way the code does.
- For a failure scenario, check both the error and the state left behind. After a refused second hop, the first hop is closed.
- Compare through the constructors and values the code already has. A test is not a caller: never add an accessor, variant or equality to production code only so a test can observe something.
- Where a plausible wrong outcome exists, assert that it didn't happen.

## Protecting the check

- Behaviour, contract and smoke tests for approved scenarios and ports are the safety net. Never edit one to get green. When one fails, either the code is wrong, or the scenario is. A wrong scenario goes back through shape, and the test changes only after the user approves the changed scenario.
- Domain tests are disposable. Rewrite or delete them along with the code they test.
- Never skip a test, delete one, or weaken an assertion to finish. Review flags any weakened safety-net test.

## What not to write

- Tests of private functions, getters or plain data.
- Tests that restate the implementation, including snapshots whose expected output was derived the same way the code derives it.
- Mocks of internal collaborators, and assertions on calls that aren't part of a contract.

Side-by-side examples are in [examples.md](examples.md).

## Naming and tracing

- Every behaviour test carries its scenario's ID in a comment or string, such as `// SCN-open-serial.attach` on the line above it. A test name alone doesn't count, since `cruze trace` looks for the literal ID.
- A scenario may need several tests, and each of them carries its ID. One test covers one scenario.
- `cruze trace <slug>` fails when one of the feature's scenarios has no test carrying its ID, or when a test cites a scenario no feature defines. Run it before calling a feature's tests complete, and quote its result.
