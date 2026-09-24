---
name: cruze-formats
description: The formats and templates of every Cruze project document. Use when reading, writing or reviewing any file under docs/ or .cruze/ in a Cruze project.
---

# Cruze document formats

Every Cruze document is Markdown that people read and the `cruze` CLI parses. Write them exactly in these formats: `cruze validate` rejects documents that drift, and approvals, staleness and merges all depend on the structure.

## Where documents live

| Path | Document | Written by |
| --- | --- | --- |
| `docs/vision.md` | Problem, users, goals, non-goals, constraints, feature map | envision (project scope) |
| `docs/glossary.md` | Domain terms and terms to avoid | any step, as terms settle |
| `docs/architecture.md` | Contexts, domain model, use cases, ports, adapters, flows, modules, rules | architect (project scope), rethink, land |
| `docs/adr/<date>-<slug>.md` | One decision that is hard to reverse, surprising and a real trade-off | architect, rethink |
| `docs/specs/<capability>.md` | Living behaviour: requirements and scenarios | land, from spec deltas |
| `docs/roadmap.md` | The current release: phases, items, coverage | architect (project scope), roadmap |
| `.cruze/features/<id>/feature.md` | One feature: intent, deltas, its ordered changes | envision and architect (feature scope) |
| `.cruze/features/<id>/changes/<NN-slug>/change.md` | One change of a feature: scope, test plan, tasks | plan |
| `.cruze/changes/<id>/change.md` | A standalone change, carrying its own deltas | architect (tweak scope) |
| `.cruze/config.yaml` | Project configuration | `cruze init`, architect |
| `.cruze/notes/<date>-<slug>.md` | A captured explore note, free-form | explore |

Only the CLI writes `approvals.json`, `journal.jsonl` and anything under `.cruze/archive/`.

## IDs

An ID names one element for its whole life. Other documents cite it, tests carry it, and approvals hash it.

- Grammar: `<KIND>-<name>` or `<KIND>-<scope>.<name>`. `scope` and `name` are lowercase words joined by single hyphens, such as `REQ-access.open-console`.
- Elements that belong to a bounded context or a capability carry it as their scope. Elements outside every context, such as the CLI shell and the composition root, use the scope `system`.
- IDs are named, never numbered, so parallel branches never race for the next number.
- An ID is never reused, even after its element is removed. Rename the title freely; the ID stays.

| Kind | Element | Lives in | Scope |
| --- | --- | --- | --- |
| `GOAL` | A goal of the product | vision | none |
| `CTX` | Bounded context | architecture | none |
| `ENT` | Entity, aggregate or value object | architecture | context |
| `UC` | Use case (the application's driving API) | architecture | context |
| `PORT` | Port, driven or driving | architecture | context |
| `ADP` | Adapter | architecture | context |
| `FLOW` | Interaction flow, as a sequence diagram | architecture | context |
| `MOD` | Module: a directory or file with one role | architecture | context, or none for shared modules |
| `RULE` | Dependency rule | architecture | none |
| `VIEW` | Overview diagram | architecture | none |
| `XC` | Cross-cutting concern | architecture | none |
| `REQ` | Requirement | specs | capability |
| `SCN` | Scenario of a requirement | specs | capability |
| `ADR` | Decision record, named by its file stem | `docs/adr/` | none |

## Elements

- A **heading element** is a heading whose text is exactly `<ID>: <Title>`. It extends to the next heading of the same or a higher level.
- A **row element** is a table row whose first cell is exactly an ID. Only goals use rows.
- Element facts are list items of the form `- Key: value`, directly in the element's body. Sub-items hold lists of values.
- An element cites another by writing its ID anywhere in its body. Every ID a document mentions counts as cited.
- A cited ID must exist, either in the living docs or in a delta of the same feature or change. Design at project scope cites only what it defines; the feature that adds scenarios links them to flows and use cases through `MODIFIED` operations.

## Managed content

The CLI owns some content so that routine bookkeeping never changes a design:

- A block between `<!-- cruze:managed -->` and `<!-- /cruze:managed -->` is written only by the CLI.
- A `- Status: planned` or `- Status: built` item in an element body is written only by the CLI. Elements that have code (`ENT`, `UC`, `PORT`, `ADP`, `FLOW`, `MOD`) and scenarios (`SCN`) carry one.
- Both are excluded from every hash. Read them freely; change them only through `cruze` commands: `cruze approve` adds missing statuses to the architecture and binds a change to its branch, `cruze task` records progress, `cruze features` edits the feature map, and `cruze land` merges work and marks it built.

## Reference files

Read the one that matches the document in front of you:

- `reference/architecture.md` for `docs/architecture.md` and architecture deltas.
- `reference/specs.md` for `docs/specs/`, requirements, scenarios and spec deltas.
- `reference/work-items.md` for `feature.md`, `change.md`, test plans and task lines.
- `reference/durable-docs.md` for vision, glossary, ADRs and the roadmap.
- `reference/config.md` for `.cruze/config.yaml`.

Start new documents from the matching file in `templates/`. Replace every `<angle-bracket>` guide; the CLI fills `{{placeholders}}`.
