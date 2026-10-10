# A module Path written as a glob matches no file

- Proposal: `cruze validate` reports `module-path-glob` for a `MOD` Path containing a glob.
- Evidence: ork bundle (Cruze 0.0.7): architecture rethink at 2026-10-07T00:27:39 ("MOD-system.crate-roots and MOD-system.build used glob Paths that cruze validate can't resolve when checking tasks"), found by plan, missed by architect.
- Asset: src/domain/validation/element_rules.ts, skills/formats/reference/architecture.md ("Element facts")

## Situation

On the console-access fixture, `MOD-access.adapters` has Path `` `src/access/adapters/**` ``.

## Expected

`cruze validate` reports a `module-path-glob` error naming the module and the glob, at architecture time, before any plan relies on it.

## Check

Test: `test/validate.test.ts`, "reports a module Path written as a glob as module-path-glob".
