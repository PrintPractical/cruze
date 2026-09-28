# One error enum per layer, mirroring the one below it

- Proposal: the hexagonal-design error rules say an error type exists only where a caller handles its cases differently. A use case returns or wraps the domain error instead of copying it, similar failures share one type with the difference as a field, and a function returns only failures its callers can meet. The Rust notes drop "an enum for the domain, each use case and each adapter".
- Evidence: a code review of the mw-configuration-service repository, requested by the maintainer on 2026-09-28. There are 33 error types across domain and app, including `DeleteRejection`, which copies `DeleteProblem` variant for variant; the families `BatchTooLarge`/`MutationTooLarge`/`SetTooLarge` and `RepeatedSetId`/`RepeatedInMutation`; `PersistentProblem::Inconsistent`, matched as `unreachable!` at its only caller (`apply_persistent_mutation.rs:121`); and an `expect` for the same reason (`commit_generation.rs:42`). The old rule in `skills/hexagonal-design/languages/rust.md` asked for exactly this.
- Asset: skills/hexagonal-design/SKILL.md (Representations and errors, Warning signs), skills/hexagonal-design/languages/rust.md (Errors)

## Situation

On the console-access fixture, build 01-local-serial. Per `docs/architecture.md` and the feature delta, UC-inventory.find-device fails with an unknown device or the configuration errors of UC-inventory.list-devices. UC-access.open-console fails with an unknown device, a failed hop, or no usable terminal.

## Expected

- `FindDevice`'s error reuses list-devices' configuration error by wrapping it in one variant, and adds only the unknown-device case.
- `OpenConsole`'s error wraps `FindDevice`'s in one variant, and adds only the hop and terminal failures. No variant repeats unknown device or a configuration error.
- No `unreachable!` arm matches an error variant.

## Check

Fixture run: headless `build` of 01-local-serial. List the error enums under `src/`, and check that none shares its variant names with another and that `grep -rn "unreachable!" src` finds no error match.
