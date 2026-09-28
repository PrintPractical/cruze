# Tests that outgrow their file land in two different places

- Proposal: in the Rust language file, tests that push a source file past its budget move to the crate's `tests/` directory, named after the module (`tests/<module>.rs`, or `tests/<module>/main.rs` with one file per topic), never to `src/<module>/tests.rs` or `src/<module>/tests/`. `cruze check` warns `test-placement` for a Rust file under `src/` with a `tests` path segment.
- Evidence: the maintainer found that half the project's crates keep tests in `tests/` and half in `src/<module>/tests.rs`. mw-config-service-export.json (Cruze 0.0.1): deviation at 2026-09-26T15:45 (01-unique-priorities T1) split `live_sets/tests.rs` into `live_sets/tests/priorities.rs` and `live_sets/tests/resubmissions.rs`; deviation at 2026-09-26T16:01 (T4) moved tests to `crates/mwcfg-protocol/tests/error_codes.rs`.
- Asset: skills/hexagonal-design/languages/rust.md, skills/plan/test-plan.md (step 5), src/domain/check/check_source.ts

## Situation

On the console-access fixture, give `src/access/domain/console_session.rs` an inline test module that takes it to 240 lines, then plan and build a change that adds three more domain tests for it.

## Expected

The new tests, and the inline ones they join, live in `tests/console_session.rs` or `tests/console_session/`. No file under `src/` has a `tests` path segment, and `cruze check` reports no `test-placement` warning.

## Check

A test in `test/check_trace.test.ts`: "flags Rust tests split out into files under src/, and leaves inline modules and tests/ alone". Also a fixture run of `plan` and `build`, looking at where the new tests land.
