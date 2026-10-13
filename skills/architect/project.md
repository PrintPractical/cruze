# Architect at project scope

The result has four parts, reviewed together and shown at one walkthrough:

- `docs/architecture.md`, the living model of the whole system, which the user approves.
- The `layers:` rules in `.cruze/config.yaml`.
- `docs/roadmap.md` for the first release, which the user approves as its own step.
- The foundation change, the first one the project builds, designed and ready for `plan`. It is approved later, once `plan` has filled its test plan and tasks.

## Design the architecture

1. **Create it.** Run `cruze new architecture`. Follow its sections in order, one at a time, and grill the user on each section's material decisions before writing it.
2. **Bounded contexts (`CTX`).** Group the vision's capabilities into contexts by which language and rules belong together. Most small systems have one to three. Each context has a `Purpose`, and a `Depends on` naming what it uses from other contexts. Regroup the glossary's terms under one `##` heading per context.
3. **The foundation.** Settle with the user what the first change builds, as "Choosing the foundation" says. Then design the whole release end to end, so the foundation is shaped by everything that will use it, at two depths:
   - **In full** for what the foundation builds: every fact steps 4 to 8 ask for.
   - **At the boundaries** for the rest: each part's use cases, the operations and data that pass between parts, and the flows that cross them, with their main results and errors. The specifics inside, such as limits, edge cases, messages and adapter technology, stay open, each named in a `Future` fact, for the feature that builds the part.
4. **Domain model (`ENT`).** For each context, model the concepts the vision and glossary name, including invariants, relationships with cardinality, and `States` for anything whose valid operations depend on its state. Add the `VIEW-domain-model` class diagram.
5. **Use cases (`UC`).** Write one per operation a caller can ask for in this release, each with its input, output, errors and the ports it uses.
6. **Ports (`PORT`).** Define every capability the use cases need from outside, named by capability. Write each operation's contract, following `.agents/skills/cruze-hexagonal-design/contracts.md`. Add driving ports only where the hexagonal-design skill calls for them.
7. **Adapters (`ADP`).** Name the technology behind each driven port and each inbound adapter that drives use cases. Run the researcher role on every adapter's technology first, and record the result in the adapter's `Adopts` fact. Take every new dependency to the user.
8. **Flows (`FLOW`).** Write a `sequenceDiagram` for each of the 2 to 5 most important interactions, including their failure paths. Leave out `Serves` until scenarios exist.
9. **Modules (`MOD`).** Name the kind of system in the Overview, and choose the layout that is normal for that kind and the language, following `.agents/skills/cruze-hexagonal-design/shapes.md` and the language file. Give each context the fewest modules that keep its layer rules, usually one `core` module and its adapters, and give the shared CLI shell and the composition root the `system` scope. Add a `system` module in the `composition` layer for the build and CI files, such as the package manifest and `.github/workflows/`, so the tasks that write them have an owner. Every source file must fall inside some module's `Path`, including namespace files that join a context's modules, such as `src/inventory/mod.rs` or `index.ts`; list them in a `composition` module's `Path` when no other module fits. Every module gets a `Path` and a `Layer`, and every element above gets its `Module` and `File`.
10. **Dependency rules (`RULE`).** State what may import what, in one or two sentences each.
11. **Cross-cutting concerns (`XC`).** Cover errors, configuration, logging, concurrency and security, plus build and delivery (CI, formatting, linting). Read `.agents/skills/cruze-hexagonal-design/runtime.md` for concurrency.
12. **Decisions.** Write an ADR, with `cruze new adr <slug> --title "<title>"`, for each decision that passes the ADR test. Record the other project decisions as `D<n>` lines under `## Decisions`, including each design choice handed to `architect` that the user keeps.
13. **Overview (`VIEW-context`).** Draw the context diagram last, once the adapters and external systems are known.

Done when `cruze validate` reports no errors in `docs/architecture.md`. At this stage it warns that elements have no status yet; approval adds the statuses.

## Write the layer rules

Fill `source`, `tests` and `layers:` in `.cruze/config.yaml` from the module map, following `.agents/skills/cruze-formats/reference/config.md`. Give each module's `Path` exactly one layer, and make each layer's `may_import` match the `RULE` elements. Done when `cruze validate` reports no config errors and no `module-layer` warnings.

## Ignore build output

Add the language's build output and tool caches to `.gitignore` now, such as `/target` for Rust or `node_modules/` for Node, so no later commit sweeps them in.

## Plan the release

1. **Create the roadmap.** Run `cruze new roadmap`. Agree the first release with the user: its name, and which features from the vision's feature map it delivers. Take up the delivery order handed to `roadmap`, as for any hand-off.
2. **Order the work.** Phase 1 holds only the `foundation` change. Later phases hold the release's features. Done when the roadmap passes the rules in step 5 of `.agents/skills/cruze-roadmap/SKILL.md`.
3. **Design the foundation.** Run `cruze new change foundation --title "<what it builds>"`. Then:
   - Size the elements it builds for the foundation. Anything it lists under `Builds` is marked built when it lands, so write those elements, such as the CLI adapter or the first entity, at the size the foundation needs. Record their planned growth in `Future` facts; later features grow them through `MODIFIED` operations.
   - Build the kind the user chose, nothing more. It also makes CI real: `cruze init` already runs `cruze validate`, `cruze check --ci` and `cruze trace --all` there, and the foundation adds the language's format, lint, build and test steps. `plan` fills `commands:` in `.cruze/config.yaml` for it.
   - Write its `## Intent`.
   - In `## Adopt or build`, add a row for each tool it adds that no adapter owns, such as the test framework, linter or CI runner.
   - Write the `## Spec delta` for the one capability it delivers, with scenarios.
   - In `## Architecture delta`, link the new behaviour to the design: a `MODIFIED` operation for each use case that serves its requirements, adding them to `Serves`, and for each flow that runs its scenarios, adding them to its `Serves`. Each body is the element's full text from `docs/architecture.md` with that fact added.
   - Fill `## Scope`. `Delivers` lists its scenarios. `Builds` lists the elements it modifies, the other architecture elements it builds, and every module whose first files it writes.
   - Leave the test plan and tasks to `plan`.
   - Done when `cruze validate` reports only the change's `not-planned` warning.

## Choosing the foundation

The foundation is the first change, which everything else builds on and the user tries first. Which kind fits is the user's decision. Ask it as a grilling question, sketching each option in this project's terms, with your recommendation:

- **Product shell:** every screen, page or command the release offers, wired together, showing sample data, with no logic behind it yet. It suits settling look and flows before logic.
- **Core component:** the component the others depend on, working for real through its own interface, such as a server with its command-line client. Later phases add one component at a time, and shared machinery, such as a framework, after two of its users. It suits a system of several components.
- **Walking skeleton:** one use case through every layer: an inbound adapter, its domain, a driven adapter and the composition root. It suits a small system.

It must fit the change size limits in `.cruze/config.yaml`; when it doesn't, settle with the user what moves to Phase 2. Record the choice as a `D<n>` line in the architecture's `## Decisions`.

## Review, walk through and approve

1. Run the design review and the walkthrough from the skill's steps 6 and 7, over the architecture, the config, the roadmap and the foundation together.
2. When the user approves the design, run `cruze approve architecture`. It marks every element `planned`.
3. Confirm the release ordering with the user, then run `cruze approve roadmap`.
4. Add an `## Architecture` section to `README.md`: one sentence on the system's shape, the `VIEW-context` diagram, and a link to `docs/architecture.md`.
5. Commit, with a message such as `docs: approve the architecture and roadmap`.

Done when `cruze status` shows the vision, the architecture and the roadmap approved.
