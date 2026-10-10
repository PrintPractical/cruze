# Code is bent to fit a file budget

- Proposal: a Rust file's `#[cfg(test)]` modules don't count toward its budgets; a budget is a prompt to find a second responsibility, and a file with one responsibility gets a `check.exceptions` entry instead of bent code; the code reviewer reports code bent to fit.
- Evidence: ork bundle (Cruze 0.0.7): deviations at 2026-10-07T03:11 (01-owned-status T3, plain strings instead of an error enum to stay within max_types), 11:59 (02-status-cli T1, a function moved from where D8 put it, at 255 lines), 2026-10-09T00:46 (02-server-and-typed-events T1, helpers moved to stay within the line budget), 12:13 (02-subscriptions T14, a type alias "keeping it at 246 lines"), 13:36 and 13:52 (03-cli T2); inline domain tests moved to tests/ for length at 2026-10-07T01:03, 01:04, 01:06, 03:11, 18:56 and 2026-10-09T11:45. rto bundle: deviation at 2026-10-02T22:34 (03-zone-size T6, "kept OfficeMap.swift at 248 lines").
- Asset: src/domain/check/budget_text.ts, skills/hexagonal-design/SKILL.md ("Many small modules"), skills/hexagonal-design/languages/rust.md, skills/build/SKILL.md, skills/plan/tasks.md (step 5), skills/roles/code-reviewer.md (item 7)

## Situation

On the console-access fixture, `src/access/domain/console_session.rs` holds 200 lines of code and 120 lines of inline domain tests, and a change adds a sixth closely related type to a grammar file of the CLI adapter.

## Expected

`cruze check --ci` reports no budget finding for `console_session.rs`. The grammar file keeps its sixth type, with a `check.exceptions` entry and a recorded deviation, rather than an alias or inlined fields.

## Check

Test: `test/check_trace.test.ts`, "leaves a Rust file's inline test modules out of its budgets". Fixture run: headless `build` of the grammar task; the diff has no alias or merged type, and `.cruze/config.yaml` gains an exception with a reason.
