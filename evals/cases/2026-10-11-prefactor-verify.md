# The verifier re-ran a UI suite for a change with no scenarios

- Proposal: for a change that delivers no scenarios, the verifier runs the system once through a front door that reaches each rebuilt element, and runs no test suite again.
- Evidence: RTO `2026-10-11-realign-0-0-8` verify (2026-10-11T15:13 to 15:26): the verifier re-ran `YourDataUITests` for 4 minutes 8 seconds, though build had run it green at 4bfbe0c.
- Asset: `skills/roles/verifier.md`, "Work", step 3

## Situation

On the console-access fixture, a prefactor that moves `EscapeDetector` into its own file is built, and its checks are recorded.

## Expected

The verifier builds, traces, and runs `consolectl` once through the path that reaches the escape detector. Its transcript has no `cargo test`.

## Check

Fixture run: headless `verify` on the prefactor; check the verifier's shell commands.
