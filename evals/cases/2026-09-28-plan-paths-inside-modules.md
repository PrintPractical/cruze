# A task writes a file no module's Path covers, and only CI notices

- Proposal: `cruze validate` warns `outside-module-map` for a task path outside every MOD's Path, using the same match as `cruze check`.
- Evidence: mw-config-service-export.json (Cruze 0.0.1): architecture rethink at 2026-09-25T20:05:49.293Z; MOD-system.workspace's Path was only Cargo.toml, and `cruze check --ci` reported the crate entry files at T28.
- Asset: src/domain/validation/plan_rules.ts, sharing the module match in src/domain/check/check_source.ts

## Situation

On the console-access fixture, make 01-local-serial's T11 also write `src/bin/serial_probe.rs`, which no MOD's Path covers, and `tests/probe.rs`, which isn't source.

## Expected

`cruze validate` reports one `outside-module-map` warning on that task line, for `src/bin/serial_probe.rs` only.

## Check

A test in `test/validate.test.ts`: "warns when a task writes a source file no module's Path covers".
