# Test files are split to meet a budget that doesn't apply to them

- Proposal: plan and behavioural-testing say file budgets apply to source, not tests, and a test file is split by the behaviour it covers; the config reference says test files outside `source` have no budget.
- Evidence: a code review of the mw-configuration-service repository, requested by the maintainer on 2026-09-28: 114 test binaries, with one use case's tests spread over six files (`apply_persistent_{mutation,guards,rejections,evictions,deletes,notices}`) and a port contract split into two files. mw-config-service-export.json (Cruze 0.0.1): deviations at 2026-09-26T15:45 (01-unique-priorities T1), 2026-09-26T16:01 (T4), 2026-09-27T14:17 (09-replay T2) and 2026-09-27T20:55 (01-ephemeral-batches T10) split test files for size.
- Asset: skills/plan/tasks.md (step 5), skills/behavioural-testing/SKILL.md, skills/formats/reference/config.md

## Situation

On the console-access fixture, let `tests/access_open_console.rs` reach 240 lines, then plan and build a change that adds two scenarios to UC-access.open-console.

## Expected

The new tests go in `tests/access_open_console.rs`, and no deviation mentions a test file's budget.

## Check

Fixture run: headless `plan` and `build`. Look for the new tests in the use case's file, and for no deviation about test file size.
