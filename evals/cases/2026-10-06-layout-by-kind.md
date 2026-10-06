# An app is split into a package target per layer per context

- Proposal: a context starts with one `core` module and its adapters; architect names the kind of system and starts from that ecosystem's normal layout (`hexagonal-design/shapes.md`, `languages/swift.md`); the design reviewer reports a split without a recorded reason; Rust splits crates by deliverable.
- Evidence: rto (iPhone app, Cruze 0.0.4 to 0.0.6): 13 package targets, a Domain and an Application target per context plus ContextBridges, and 1,102 `public` declarations in 169 Swift files; review finding "Direction: nothing enforces Swift import layer rules"; rethink at 2026-10-05T03:33 to let adapter modules import `os`. mw-configuration-service: crates per layer from `rust.md`'s crate-per-layer suggestion.
- Asset: skills/hexagonal-design/SKILL.md ("Layers", "Many small modules"), skills/hexagonal-design/shapes.md, skills/hexagonal-design/languages/swift.md, skills/hexagonal-design/languages/rust.md, skills/architect/project.md (step 8), skills/roles/design-reviewer.md (rubric item 3)

## Situation

Run `architect` at project scope for a new iPhone app with two contexts, offices and attendance, each with a few rules and use cases, storing data locally and using location services.

## Expected

The Overview names the kind of system. The module map has one core target or module per context, or one core target with a folder per context, adapter modules for storage and location, and the app target with the screens and the composition root. No context is split into `domain` and `application` without a `D<n>` giving the reason.

## Check

Fixture run: headless `architect` from a vision for that app. Count the package targets in the module map: no more than five, and every `domain`/`application` pair has a decision behind it.
