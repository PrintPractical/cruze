# Rust

These add to the hexagonal design rules for Rust projects. The module map decides the layout; this file never does.

## Modules

- `main.rs` is the composition root and stays thin. `lib.rs` and every `mod.rs` hold only module declarations, visibility and deliberate re-exports, and `lib.rs` exposes the use cases, ports and domain types that tests drive.
- Name modules for the concept they own. Don't put domain definitions in a `mod.rs`, and don't create `domain.rs`, `services.rs`, `models.rs` or `utils.rs` catch-alls.
- Where the layer rules need a hard boundary, a Cargo workspace with one crate per layer makes the compiler enforce it. The walking-skeleton change decides this.

## Modelling

- Use structs for entities and aggregates, enums for closed alternatives and states, and newtypes for primitives with meaning (`struct DeviceName(String)`).
- Use concrete functions and types for single-strategy behaviour. Use traits for ports and for strategies that really vary. A struct doesn't need a trait of its own.
- Prefer APIs that keep invariants: validating constructors (`TryFrom`, `parse`), private fields, and no public setters that skip a rule.

## Ports and injection

- Ports are traits owned by the application layer. Adapter types never appear in their signatures.
- Inject through constructors or parameters. Prefer generics (static dispatch). Use `Box<dyn Trait>` or `Arc<dyn Trait>` only when you need to choose at runtime or store mixed implementations.

## Errors

- Define error enums with `thiserror` where the hexagonal-design error rules call for a type, not one per layer by default. A use case whose only failure is a domain error returns that error. One that adds failures wraps it in a single `#[from]` variant.
- Put what differs between similar failures in fields, such as `TooLarge { subject: Subject, size: usize, limit: usize }`, rather than `BatchTooLarge`, `MutationTooLarge` and `SetTooLarge`.
- A match arm that can only be `unreachable!`, or an `expect` on an error the caller has ruled out, means the callee returns too wide a type: narrow it.
- `anyhow` belongs only in the composition root and binaries, where no caller inspects the error. Never return it from a port or a domain function.
- No `unwrap`, `expect` or `panic!` for conditions that can happen in production. Tests may use them.

## Async and concurrency

- Use Tokio when the project needs async. Keep the domain synchronous.
- Call async functions directly. Spawn a task only when it owns a resource, runs concurrently, handles events or isolates failure, and give every long-lived task an explicit shutdown.
- Prefer ownership and borrowing over shared synchronization. Use a channel when one task owning the state makes things simpler, and a `Mutex` when shared state is simpler. Don't build an actor only to avoid a lock.

## Dependencies and tooling

- Common choices, still subject to `.agents/skills/cruze-dependency-approval/SKILL.md`: `serde` at serialization boundaries (never as a reason to couple domain types to a format), `tracing` for instrumentation, `clap` for CLI parsing, `thiserror` for errors.
- Add dependencies with `cargo add`, so the version comes from the registry.
- No `unsafe` unless the user approves it or an unavoidable low-level boundary needs it, with a `// SAFETY:` comment giving the reason.
- Format with `cargo fmt`, lint with `cargo clippy -- -D warnings`, and test with `cargo test`.
- Behaviour, contract and smoke tests live in the crate's `tests/` directory and reach the code through the library's public API. Domain tests sit in a `#[cfg(test)] mod tests` beside the code and need no fakes.
- When a module's inline tests would take its file past the budget, move them to the crate's `tests/`, named for the module: `tests/<module>.rs`, or `tests/<module>/main.rs` declaring one file per topic, such as `tests/generation/add_generation.rs`. Cargo builds each `tests/*.rs` and each `tests/*/main.rs` as a test binary, and nothing deeper. Never move them to `src/<module>/tests.rs` or `src/<module>/tests/`: `cruze check` reports those as `test-placement`. A test that needs a private item is testing structure, so drive the public API instead. When a private seam really is the contract, such as a filesystem trait a crash test injects, list the file under `check.exceptions` with that reason.
- Group integration tests into a few binaries by area, `tests/<area>/main.rs` with one module per topic, since every binary links the crate again.
- Share fakes, fixtures and harnesses within a crate through `tests/support/mod.rs`, which each test binary declares with `mod support;`. In a workspace, put what several crates' tests share in one dev-only crate, such as `<project>-test-support`, listed under `[dev-dependencies]`. Never share them with `#[path]` includes.
