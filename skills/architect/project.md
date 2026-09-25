# Architect at project scope

The result has four parts, reviewed together and shown at one walkthrough:

- `docs/architecture.md`, the living model of the whole system, which the user approves.
- The `layers:` rules in `.cruze/config.yaml`.
- `docs/roadmap.md` for the first release, which the user approves as its own step.
- The walking-skeleton change, designed and ready for `plan`. It is approved later, once `plan` has filled its test plan and tasks.

## Design the architecture

1. **Create it.** Run `cruze new architecture`. Follow its sections in order, one at a time, and grill the user on each section's material decisions before writing it.
2. **Bounded contexts (`CTX`).** Group the vision's capabilities into contexts by which language and rules belong together. Most small systems have one to three. Each context has a `Purpose`, and a `Depends on` naming what it uses from other contexts. Regroup the glossary's terms under one `##` heading per context.
3. **Domain model (`ENT`).** For each context, model the concepts the vision and glossary name, including invariants, relationships with cardinality, and `States` for anything whose valid operations depend on its state. Add the `VIEW-domain-model` class diagram.
4. **Use cases (`UC`).** Write one per operation a caller can ask for in this release, each with its input, output, errors and the ports it uses.
5. **Ports (`PORT`).** Define every capability the use cases need from outside, named by capability. Write each operation's contract, following `.agents/skills/cruze-hexagonal-design/contracts.md`. Add driving ports only where the hexagonal-design skill calls for them.
6. **Adapters (`ADP`).** Name the technology behind each driven port and each inbound adapter that drives use cases. Run the researcher role on every adapter's technology first, and record the result in the adapter's `Adopts` fact. Take every new dependency to the user.
7. **Flows (`FLOW`).** Write a `sequenceDiagram` for each of the 2 to 5 most important interactions, including their failure paths. Leave out `Serves` until scenarios exist.
8. **Modules (`MOD`).** Give each context its hexagonal modules, and give the shared CLI shell and the composition root the `system` scope. Add a `system` module in the `composition` layer for the build and CI files, such as the package manifest and `.github/workflows/`, so the tasks that write them have an owner. Every source file must fall inside some module's `Path`, including namespace files that join a context's modules, such as `src/inventory/mod.rs` or `index.ts`; list them in a `composition` module's `Path` when no other module fits. Every module gets a `Path` and a `Layer`, and every element above gets its `Module` and `File`.
9. **Dependency rules (`RULE`).** State what may import what, in one or two sentences each.
10. **Cross-cutting concerns (`XC`).** Cover errors, configuration, logging, concurrency and security, plus build and delivery (CI, formatting, linting). Read `.agents/skills/cruze-hexagonal-design/runtime.md` for concurrency.
11. **Decisions.** Write an ADR, with `cruze new adr <slug> --title "<title>"`, for each decision that passes the ADR test. Record the other project decisions as `D<n>` lines under `## Decisions`.
12. **Overview (`VIEW-context`).** Draw the context diagram last, once the adapters and external systems are known.

Done when `cruze validate` reports no errors in `docs/architecture.md`. At this stage it warns that elements have no status yet; approval adds the statuses.

## Write the layer rules

Fill `source`, `tests` and `layers:` in `.cruze/config.yaml` from the module map, following `.agents/skills/cruze-formats/reference/config.md`. Give each module's `Path` exactly one layer, and make each layer's `may_import` match the `RULE` elements. Done when `cruze validate` reports no config errors and no `module-layer` warnings.

## Ignore build output

Add the language's build output and tool caches to `.gitignore` now, such as `/target` for Rust or `node_modules/` for Node, so no later commit sweeps them in.

## Plan the release

1. **Create the roadmap.** Run `cruze new roadmap`. Agree the first release with the user: its name, and which features from the vision's feature map it delivers.
2. **Order the work.** Phase 1 holds only the `walking-skeleton` change. Later phases hold the release's features. Done when the roadmap passes the rules in step 5 of `.agents/skills/cruze-roadmap/SKILL.md`.
3. **Design the walking skeleton.** Run `cruze new change walking-skeleton --title "Walking skeleton"`. Then:
   - Size the elements it builds for the skeleton. Anything the walking skeleton lists under `Builds` is marked built when it lands, so write those elements, such as the CLI adapter or the first entity, at the size the skeleton needs. Record their planned growth in `Future` facts; later features grow them through `MODIFIED` operations.
   - Choose the thinnest end-to-end slice that crosses every layer: one real inbound adapter, one use case, the domain it needs, one driven adapter and the composition root. It also makes CI real: `cruze init` already runs `cruze validate`, `cruze check --ci` and `cruze trace --all` there, and the skeleton adds the language's format, lint, build and test steps. `plan` fills `commands:` in `.cruze/config.yaml` for it.
   - Write its `## Intent`.
   - In `## Adopt or build`, add a row for each tool it adds that no adapter owns, such as the test framework, linter or CI runner.
   - Write the `## Spec delta` for the one capability it delivers, with scenarios.
   - In `## Architecture delta`, link the new behaviour to the design: a `MODIFIED` operation for each use case that serves its requirements, adding them to `Serves`, and for each flow that runs its scenarios, adding them to its `Serves`. Each body is the element's full text from `docs/architecture.md` with that fact added.
   - Fill `## Scope`. `Delivers` lists its scenarios. `Builds` lists the elements it modifies, the other architecture elements it builds, and every module whose first files it writes.
   - Leave the test plan and tasks to `plan`.
   - Done when `cruze validate` reports only the change's `not-planned` warning.

## Review, walk through and approve

1. Run the design review and the walkthrough from the skill's steps 6 and 7, over the architecture, the config, the roadmap and the walking skeleton together.
2. When the user approves the design, run `cruze approve architecture`. It marks every element `planned`.
3. Confirm the release ordering with the user, then run `cruze approve roadmap`.
4. Add an `## Architecture` section to `README.md`: one sentence on the system's shape, the `VIEW-context` diagram, and a link to `docs/architecture.md`.
5. Commit, with a message such as `docs: approve the architecture and roadmap`.

Done when `cruze status` shows the vision, the architecture and the roadmap approved.
