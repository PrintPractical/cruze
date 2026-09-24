# Architecture format

`docs/architecture.md` is the living model of how the system is built. Every step reads it, including build and review. It describes the designed system for the current and upcoming releases. Each element's managed `Status` says whether it is still `planned` or already `built`.

Template: `../templates/architecture.md`.

## Sections

The document has these `##` sections, in this order. Each holds elements of one kind as `###` heading elements, plus any `VIEW` diagrams that summarize them. A section with no elements yet keeps its heading and a one-line note.

| Section | Kind | Holds |
| --- | --- | --- |
| Overview | `VIEW` | One paragraph on the system, then a context diagram |
| Bounded contexts | `CTX` | Each context's purpose and what it depends on |
| Domain model | `ENT` | Entities, aggregates and value objects, with invariants and relationships |
| Use cases | `UC` | The application API: what callers can ask the system to do |
| Ports | `PORT` | Capabilities the application needs (driven) or offers (driving) |
| Adapters | `ADP` | Technology behind ports, and inbound adapters that drive use cases |
| Flows | `FLOW` | How elements interact for key scenarios, as sequence diagrams |
| Modules | `MOD` | Where each element lives in the source tree |
| Dependency rules | `RULE` | What may import what |
| Cross-cutting concerns | `XC` | Errors, configuration, logging, concurrency, security |
| Decisions | none | Links to ADRs, one line each |

## Element facts

Facts are `- Key: value` items. Keys marked required must be present; the others appear when they apply. Multi-valued facts use sub-items.

| Kind | Required facts | Optional facts |
| --- | --- | --- |
| `VIEW` | a Mermaid block | |
| `CTX` | `Purpose` | `Depends on` (context IDs, with what is used) |
| `ENT` | `Kind` (`aggregate`, `entity` or `value`), `Module`, `File` | `Invariants`, `Relationships`, `States` (for state machines) |
| `UC` | `Input`, `Output`, `Errors`, `Uses`, `Module`, `File` | `Serves` (REQ IDs) |
| `PORT` | `Direction` (`driven` or `driving`), `Operations`, `Module`, `File` | `Implemented by`, `Future` |
| `ADP` | `Implements` (a driven port) or `Drives` (use cases), `Technology`, `Module`, `File` | `Adopts` (library and adopt-or-build reason) |
| `FLOW` | `Elements`, a Mermaid `sequenceDiagram` | `Serves` (SCN IDs, once they exist), `Failure paths` |
| `MOD` | `Path`, `Layer` (`domain`, `application`, `adapter` or `composition`) | |
| `RULE` | one or two sentences of rule | `Enforced by` (config layer names) |
| `XC` | prose | |

Rules for facts:

- Membership is never listed twice. An element's scope names its context, and its `Module` fact names its module; contexts and modules don't list their members, so adding an element never changes them.
- `File` names the real source path, one per element, with sub-items when an element spans files. Every element with code has one: an element without a file cannot be built, checked or reviewed.
- `Operations` lists each operation as a sub-item with its signature in the project's language, then its contract: what it guarantees, its failure cases and who owns cleanup.
- `Relationships` sub-items read `<verb> <ID> (<cardinality>)`, for example `- has one ENT-inventory.console-path (1)`.
- `Future` records a seam kept open for a later release and the element it will need, so later features extend the design rather than rework it.
- The CLI adds `- Status: planned` to a new element and flips it to `built` when a landed change builds it. Leave it out of what you write.

## Diagrams

- Every `FLOW` has one `sequenceDiagram`. Participants are element titles, and every participant's ID appears in the flow's `Elements`.
- The Overview `VIEW` shows contexts, the inbound adapters that drive them and the external systems adapters reach.
- A `VIEW-domain-model` class diagram in the Domain model section shows every `ENT` and its relationships.
- Keep a diagram to at most 15 nodes. Split a bigger picture into two views.

## Architecture delta

A feature, or a standalone change, proposes architecture edits in its `## Architecture delta` section. Each operation is a `###` heading:

```markdown
### ADDED PORT-access.hop-connector: HopConnector
- Direction: driven
- ...the full element body, as it will read in architecture.md

### MODIFIED UC-access.open-console: Open a console
- ...the full new body, replacing the old one

### REMOVED ADP-access.telnet-connector: Telnet connector
- Reason: telnet support was dropped from the release scope
```

- `ADDED` introduces an ID that doesn't exist yet. `MODIFIED` replaces an existing element's whole body. `REMOVED` retires an ID and needs a `Reason`.
- The element kind decides its section. `land` appends an added element to the end of its section.
- A delta never touches `Status`. A change's `Builds` scope decides what becomes built.
- A delta with no operations says `None.` under its heading.
- Direct edits to `docs/architecture.md` happen only at project scope and through `rethink`. Every other design change arrives as a delta.
