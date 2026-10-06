# Shapes by kind of system

Start from the layout that is normal for the kind of system and its language, then place each owner in it. The hexagonal rules decide what depends on what. They don't decide the folders: a reader who knows the ecosystem should find the code where they expect it.

Name the kind in the architecture's Overview. A system can be more than one kind, such as a daemon that ships a client library and a CLI. Each is then its own deliverable, with its own entry point, and in a language with packages, its own package.

## Library

A crate, package or SDK that other code calls.

- The public API is the inbound adapter. Callers drive the use cases through it, so keep it small and treat it as a contract: read [contracts.md](contracts.md).
- A pure library, with no I/O, has a core only: no ports and no application layer.
- A client library that talks to a server keeps the transport and the wire format behind driven ports, so its tests run against a fake server. Group its modules by what callers do with it, such as `connection`, `consumer` and `provider`, with the wire format and the transport as adapters.

## Daemon or service

A process that runs until it is stopped, serving requests or reconciling state.

- `main` is the composition root and stays thin: configuration, construction, signals and shutdown.
- One inbound adapter per interface it offers, such as HTTP, IPC, a message consumer or a signal handler. Each decodes, calls one use case and encodes.
- One outbound adapter per technology it uses, such as storage, the OS, a subprocess or another service.
- Each context's core is one module, by concept. Long-lived tasks and their shutdown follow [runtime.md](runtime.md).

## Mobile or desktop app

An app with screens, on a platform that hosts it.

- Group modules by feature, such as `Offices` or `Dashboard`, each with its core and its screens.
- A screen's view and its model form the inbound adapter: the model maps what the person does to use cases, and use-case results to what the view shows. Neither holds a domain rule.
- Platform frameworks, such as location, notifications, maps and storage, are outbound adapters behind ports named for the capability, such as `ZoneMonitor` rather than `CoreLocationClient`.
- The app's entry point is the composition root.
- Most tests drive the core and the screen models with fakes. UI tests prove only what needs the screen itself, one or two per flow, because they are the slowest tests the project has.

## CLI tool

A program a person or a script runs and that exits.

- The commands are the inbound adapter, one module per command or command group. Argument parsing and output formatting stay there, and each command calls one use case.
- The filesystem, the network, the terminal and the clock are outbound adapters where tests need to fake them.

## Splitting further

Split a deliverable into more packages, crates or targets only for a concrete need, and record it as a `D<n>` decision:

- a second deliverable that shares the code, such as a client library, a CLI or an app extension;
- a dependency boundary the build should enforce, such as keeping a platform framework out of the core's tests;
- build time, when one package has grown too slow to build and test alone.

A package per layer, or per layer per context, is rarely normal in any ecosystem. Each boundary costs a public API between the layers and slows the build, and `cruze check` enforces the layer rules inside a package where it reads the language's imports.
