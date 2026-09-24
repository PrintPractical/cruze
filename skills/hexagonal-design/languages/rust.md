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

- Define structured error enums with `thiserror` for the domain, each use case and each adapter, and convert between them at the boundaries.
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
- Behaviour, contract and smoke tests live in `tests/` and reach the code through the library's public API. They share fakes through `tests/support/mod.rs`, which each test file declares with `mod support;`. Domain tests sit in a `#[cfg(test)] mod tests` beside the code and need no fakes.
