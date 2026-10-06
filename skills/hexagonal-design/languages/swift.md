# Swift

These add to the hexagonal design rules for Swift projects, such as iOS and macOS apps and Swift packages. The module map decides the layout; this file never does.

## Packages and targets

- Every target is a Swift module, and anything another target uses must be `public`. Each target boundary costs access-control boilerplate and build time, so use few:
  - one core target for the app's contexts, with a folder per feature or concept;
  - adapter targets only where a framework or package must stay out of the core, or one adapters target for all of them;
  - the app target, holding the screens, their models and the composition root, or a feature target per feature once the app is large enough to build and preview features alone;
  - one test-support target with the fakes and fixtures every test target shares.
- Keep `internal`, the default, for everything used inside its target. Use `package` for what the package's own targets share, and `public` only for what the app target or another package needs.
- A target can import only the targets and packages it declares in `Package.swift`, so declared dependencies enforce those boundaries. They don't stop a target importing a platform framework, such as `CoreLocation` or `SwiftUI`, which any target can import. Review checks framework imports against the layer rules, or a short CI script lists them per target.
- Keep the core free of UIKit, SwiftUI and other platform frameworks. Its tests then build and run without the app, and with a macOS platform in `Package.swift`, without a simulator.

## Modelling

- Use structs for values and entities, enums for closed alternatives and states, and classes only where identity needs reference semantics. Wrap primitives with meaning, such as `struct OfficeName { let value: String }`, with a failable or throwing initializer that enforces the invariant.
- Use concrete types for single-strategy behaviour. Use protocols for ports and for strategies that really vary.

## Ports and injection

- Ports are protocols owned by the core, named for the capability. Platform types, such as `CLLocation` or `UNNotificationRequest`, never appear in their signatures.
- Inject through initializers. The composition root at the app's entry point builds the adapters and the use cases, and hands each screen's model what it calls.

## Screens

- A SwiftUI view and its `@Observable` model are the screen's inbound adapter. The model calls use cases and maps their results to what the view shows. Domain rules stay out of both.
- Test the model with fakes behind its use cases' ports. Keep UI tests for what only the running screen can show.

## Errors and logging

- Throw a typed error, `throws(OfficeChangeError)`, where callers handle its cases differently, and use plain `throws` elsewhere. Never `try!` or `fatalError` for a condition that can happen in production. Tests may use them.
- Log with `os.Logger` in adapters, use cases and screen models. The domain doesn't log.

## Concurrency

- Use the Swift 6 language mode. Domain values are `Sendable` structs and enums. A use case is a struct, or an actor when it owns mutable state that several callers reach.
- `@MainActor` belongs on views and their models, not on the core.
- Don't mark a type `@unchecked Sendable` without a comment giving the reason.

## Tooling and tests

- Format with `swift format format --in-place --recursive`, and lint with `swift format lint --strict --recursive`.
- Package tests live in `Tests/<Target>Tests/`. They import the target with `@testable import`, which makes its `internal` declarations visible, so nothing is made `public` only for tests. UI tests live in the app's UI test target.
- Put the package's tests in the `test` command and the app's UI tests in `test_full`, as `.agents/skills/cruze-formats/reference/config.md` describes, since UI tests run through the simulator and are by far the slowest.
