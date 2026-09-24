---
name: cruze-hexagonal-design
description: The architecture standard for a Cruze project, covering hexagonal ports and adapters with domain-driven design, the owner of each rule, dependency direction, many small modules and composition. Use when designing or reviewing the architecture or an architecture delta, when placing a new element in the module map, when naming a port, adapter or module, when writing code that adds a type, file or import between modules, or when reviewing code for layering and structure.
---

# Hexagonal design

The system is a hexagon. A domain and an application form the core, and adapters reach the outside world through ports. Every rule has one owner, dependencies point inward, and the module map in `docs/architecture.md` says where each owner lives. Designs, plans, code and reviews are all held to this standard.

## Placing an owner

Follow these steps whenever a design or a task introduces behaviour, such as a rule, a workflow, a mapping or an integration.

1. Describe one representative operation in the caller's terms before choosing any structure. Done when you can say who calls, with what, and what they get back or see fail.
2. Search the living docs and the code for an existing owner of the same behaviour. Reuse or extend it when it is correct. Done when you can name the owner, or can say that none exists.
3. Name the owner by what it means, in the glossary's terms. A rule or invariant goes to a domain concept (`ENT`), a workflow to a use case (`UC`), a capability the application needs to a port (`PORT`), and a technology to an adapter (`ADP`).
4. Place it in the module map. Its `Module` names a `MOD` whose `Layer` matches its role, and its `File` names the real path. Done when every new element has both, and its module's layer may import everything the element uses.
5. Check the direction of every new dependency against the `RULE` elements and the `layers:` in `.cruze/config.yaml`. Done when no dependency points outward.
6. Name the tests that will prove it, following `.agents/skills/cruze-behavioural-testing/SKILL.md`. When a plausible wrong outcome exists, make sure a scenario step rules it out, such as `AND the first hop is closed`.

Stop when the behaviour and its boundaries are covered. A pure library needs no application layer or ports, so don't invent layers to complete the recipe.

## Priorities

When two rules pull apart, the earlier one wins. Prefer the simplest design that keeps all of them, and never simplify by merging responsibilities that mean different things.

1. Domain rules and invariants have the right owner.
2. Use-case boundaries are explicit.
3. Dependencies point inward.
4. Concepts and modules are cohesive.
5. Each behaviour has one authoritative implementation.
6. Infrastructure and runtime resources have clear owners.
7. The design is simple within those boundaries.
8. Runtime cost is low where the workload makes it matter.

## Layers

| Layer | Owns | May depend on |
| --- | --- | --- |
| `domain` | Concepts, state, rules, invariants and domain errors (`ENT`) | Domain code, the standard library, and approved libraries with no infrastructure in them, such as an error-derive crate |
| `application` | Use cases (`UC`) and the ports they define (`PORT`) | The domain |
| `adapter` | Inbound adapters that drive use cases, and outbound adapters that implement driven ports (`ADP`) | Application, domain and third-party libraries |
| `composition` | Constructing adapters, injecting them, starting the runtime | Everything |

`cruze check` enforces imports between the project's own layers. It allows every third-party import, so review checks that infrastructure libraries appear only in adapters.

Layers are dependency boundaries, not runtime hops. A port can be a plain function call. Add a task, thread, channel or process only for a concrete ownership, concurrency, isolation or backpressure need, and read [runtime.md](runtime.md) first.

### Domain

- Identify domain logic by meaning, not complexity. A one-line rule about what the domain means still belongs in the domain.
- Model each concept with the smallest building block that fits: value object, entity, aggregate, domain service or policy, domain error, or a domain event when the event means something to the domain. Each is an `ENT` with the matching `Kind`; domain errors live with the concept that raises them.
- Prefer meaningful types over primitives when a value has identity, constraints or units, such as `DeviceName` rather than a string. Make invalid states unrepresentable where practical, and enforce each invariant in the type that owns it.
- Keep aggregates small. Data being related is not a reason to group it.
- The domain imports no transport, persistence, serialization format, framework, OS API, telemetry SDK, retry or connection handling. Pass information in rather than handing the domain an infrastructure handle.
- Domain behaviour is synchronous unless asynchrony is part of the domain itself.

### Application

- Write one use case per independently meaningful operation, such as `OpenConsole` or `ListDevices`, not one large service.
- A use case loads state through ports, calls domain behaviour, sequences effects, decides what a partial failure means, and translates port failures into use-case failures. The workflow stays visible in that one operation instead of spreading across pass-through services.
- A domain rule stays in the domain even when only one use case uses it.
- Add command buses, query buses or CQRS machinery only for a concrete need.

### Ports

- A driven port names a capability the application needs, not a technology: `DeviceCatalog`, `Clock` and `HopConnector`, not `TomlFile`, `TokioTimer` or `Ssh2Client`.
- The application owns each port's contract and shapes it around what the core needs, never mirroring an SDK. Read [contracts.md](contracts.md) before writing a port's `Operations`.
- A port that keeps a technology out of the core is justified with one adapter. An interface over an internal policy with one strategy is not.
- Declare a driving port only when several inbound adapters share it or the application promises a stable contract. Otherwise an inbound adapter calls the use case directly.
- Name each thing once. Never produce `Foo`, `FooPort`, `FooService` and `FooImpl` families.

### Adapters

- Inbound adapters (CLI, HTTP, RPC, message consumers) decode input, validate it at the protocol level, map it to use-case input, call the use case and map the result back. They stay thin, with no domain rules and no workflow.
- Outbound adapters hold everything technology-specific: serialization, persistence layout, framing, retries and backoff, connections, SDK types and OS calls. They translate technology failures before those cross into the core.
- An adapter never calls an unrelated adapter to get around the application.

### Composition

- One composition root constructs the concrete adapters and runtime resources, injects them through constructors or parameters, and starts the application.
- Domain and application code never construct an adapter. There are no service locators, hidden lookups, mutable globals or implicit runtime dependencies.

## Many small modules

- Give each responsibility its own module, grouped by domain concept, with the hexagonal roles inside. A file may hold a few closely related types.
- When a file passes its budget (`check:` in `.cruze/config.yaml`, enforced by `cruze check`) or gains a second responsibility, split it into a submodule named for what it owns.
- Entry-point and namespace files, such as `main`, `lib.rs`, `mod.rs` and `index.ts`, hold only wiring and declarations.
- Don't create generic modules such as `utils`, `helpers`, `common`, `services`, `models`, `types` or `manager`. Shared behaviour belongs with the concept that owns it.
- Duplication is semantic. Two implementations of one rule are duplication even when the text differs, so consolidate them in the owner, not in a helper.
- Structure follows the module map, never a per-language template. Write idiomatic code for the language and use its standard tooling. [languages/rust.md](languages/rust.md) and [languages/cpp.md](languages/cpp.md) add rules for those languages.
- In an existing codebase, its established layout and naming win over these structure rules. Ownership and dependency direction still apply.

## Representations and errors

- Keep transport, application, domain and persistence representations separate when their meaning differs. Map them explicitly at the boundary, with one owner per mapping. Don't copy a type only to have one per layer.
- Domain errors describe domain failures, application errors describe use-case failures, and adapter errors describe infrastructure failures. Translate at each boundary and never expose an SDK's error type through a port. Expected failures are values the caller handles, not crashes.

## Warning signs

Reconsider ownership when a design or a diff shows any of these:

- An entry-point or namespace file gains behaviour.
- A module gains a second responsibility you could describe on its own.
- A handler holds a domain rule or orchestrates a workflow.
- Domain code imports infrastructure or framework types, or technology starts shaping the domain model.
- Application code constructs an adapter.
- Logic that already exists is implemented again, or a change keeps a private copy of shared behaviour.
- An interface mirrors its only implementation, or a chain of components only forwards calls.
- Commodity infrastructure is being hand-written although a mature library does it. Follow `.agents/skills/cruze-research/SKILL.md`.

These are review signals, not automatic failures. When one could be checked mechanically, propose a `cruze check` rule or a linter setting instead of repeating the finding.

## Further reading

- [contracts.md](contracts.md): writing a port's `Operations`, a public API, an IPC protocol or a stored format.
- [runtime.md](runtime.md): concurrency, long-lived resources (connections, sessions, devices, subprocesses), state machines, cancellation or a hot path.
- [fundamentals.md](fundamentals.md): choosing a data structure, a state representation or an abstraction mechanism; defining equality or ordering; bounding loops, retries and fan-out.
- `.agents/skills/cruze-dependency-approval/SKILL.md`: before any design or code adds a dependency.
