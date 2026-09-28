# Tests redefine the same fixtures and harnesses in every file

- Proposal: behavioural-testing gains a Test support section (one builder per domain value, one harness per seam, reuse before writing a helper), the Rust language file names `tests/support/mod.rs` within a crate and a dev-only test-support crate across a workspace, and the code reviewer's Idiom item checks that tests reuse them.
- Evidence: a code review of the mw-configuration-service repository, requested by the maintainer on 2026-09-28: `fn set_id(` is defined in 50 test files, the same tr069 set literal is copied into 7 CLI test files, there are three in-process daemon harnesses and two process spawners, and fakes are shared across crates with `#[path]` includes into 11 test files.
- Asset: skills/behavioural-testing/SKILL.md, skills/hexagonal-design/languages/rust.md, skills/roles/code-reviewer.md

## Situation

On the console-access fixture, build 01-local-serial and then 02-ssh-hops. Both need a valid `devices.toml` and a running `consolectl` in their tests.

## Expected

One fixture for the device file and one harness for the binary live in `tests/support/`. The second change's tests use them and define no helper of the same name. A code review of a diff that redefines one raises an Idiom finding.

## Check

Fixture run: headless `build` of both changes. Count definitions of each helper name across `tests/`: each is defined once.
