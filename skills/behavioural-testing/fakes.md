# Fakes and contract tests

A fake is a real, working implementation of a driven port that keeps its state in memory. Behaviour tests use it in place of the real adapter. Contract tests keep it honest.

## Writing a fake

1. Read the port's `Operations` in `docs/architecture.md`. The fake implements every operation with the guarantees and failures listed there, and nothing more.
2. Keep state in plain in-memory structures: a map for a catalog, a list for recorded effects, a settable value for a clock.
3. Give tests a way to arrange state and to inject each failure the contract lists. Use a constructor that takes the initial state, and a method such as `fail_next_with(HopError::Refused)`.
4. Record effects the contract makes observable, such as the order hops were closed in, so tests can assert them.
5. Put the fake where every test can reach it, such as `tests/support/` or the language's test-only module, never in production code paths. One fake per port, shared by all tests.

Done when the fake passes the port's contract tests.

## Contract tests

A contract test states the port's contract once and runs it against every implementation.

1. Write the cases as a function or suite that takes a constructor for the implementation under test.
2. Cover each operation's success, each failure the contract names, and the state after a failure.
3. Run the suite against the fake in the ordinary test run.
4. Run it against each real adapter too. When the real adapter needs something external, such as an SSH server, a serial device or a database, use a local stand-in (a test server, a pseudo-terminal, a container), and mark the run so CI can provide it.

When the contract changes, the port's `Operations` change first through a delta, then the contract suite, then the fake and the adapters.

## What a fake is not

- Not a mock that returns canned answers to expected calls. It behaves like the real thing, so a test can call it in any order.
- Not a partial stub that fails on operations "the test doesn't use". Implement the whole port.
- Not a place for logic the real adapter doesn't have. If a fake needs a rule, that rule probably belongs in the domain.
