# Vision, glossary, ADR and roadmap formats

Templates: [../templates/vision.md](../templates/vision.md), [../templates/glossary.md](../templates/glossary.md), [../templates/adr.md](../templates/adr.md) and [../templates/roadmap.md](../templates/roadmap.md).

## docs/vision.md

What the product is for. At most one page, excluding the feature map.

| Section | Holds |
| --- | --- |
| `## Problem` | The problem, in the user's words, in one short paragraph |
| `## Users` | Who uses it and in what situation, one bullet each |
| `## Goals` | Table of ID, Goal and Measure. Each goal is a row element with a `GOAL-<name>` ID, and its measure says how you would know it's met |
| `## Non-goals` | What the product deliberately doesn't do, one bullet each with the reason |
| `## Constraints` | Platforms, languages, dependencies, performance, security and legal limits, one bullet each |
| `## Feature map` | Managed. `### Implemented` is a table of Feature, Release and Summary. `### Future` is a table of Feature, Summary and Goals |

- Feature-map entries are named by slug, such as `jump-hosts`. A future entry gets a folder ID only when its feature starts.
- Only the CLI writes the feature map. `cruze features add` puts an entry on the future list, `cruze features drop` removes one, and `land` moves a finished feature to implemented, tagged with the release in progress.

## docs/glossary.md

The shared language, with no implementation detail. Anyone may add a term the moment it settles. The glossary is not approval-gated.

```markdown
## Console access

**Hop**: One link in the chain from the user to a device console: an SSH connection or a serial line.
_Avoid_: jump, leg

**Console path**: The ordered hops that reach one device's console.
_Avoid_: route, connection string
```

- Group terms under a `##` heading per bounded context, alphabetically within each group.
- A definition is one or two sentences, in terms a domain expert would accept.
- `_Avoid_:` lists synonyms to stop using, so code, docs and conversation converge on one word.
- A term used in docs or code but missing here is a signal. Either the term is new and belongs here, or someone is inventing language.

## docs/adr/<date>-<slug>.md

Write one only when a decision is hard to reverse, would surprise a newcomer, and was a real trade-off. Everything else is a settled decision: in a feature or change, or at project scope in the architecture's `## Decisions`.

```markdown
# Console paths are ordered hop chains

- Status: accepted
- Date: 2026-09-24
- Elements: ENT-inventory.console-path, PORT-access.hop-connector

<One paragraph: the context, the decision, why it won, and the alternatives rejected.>
```

- The ID is `ADR-<file stem>`, such as `ADR-2026-09-24-hop-chains`.
- `Status` is `accepted` or `superseded by ADR-<stem>`. A superseded ADR stays; the new ADR says what changed.
- Review never re-raises a decision covered by an accepted ADR without new evidence. Proposing to contradict one must name it: "Contradicts ADR-<stem>, worth reopening because…".

## docs/roadmap.md

The current release, as an index. It changes only when a feature or standalone change starts, finishes or is reordered.

| Section | Holds |
| --- | --- |
| `## Release` | The release name and one sentence on what it delivers |
| `## Phases` | One `### Phase <n>: <name>` per phase, each a table of Item (slug), Kind (`feature` or `change`), Goals and Blocked by |
| `## Coverage` | Table of Goal and the items that serve it. Every goal in scope has at least one item |
| `## Status` | Managed: each started item's folder ID and state (`designing`, `building` or `landed`). `cruze new` adds the row and `cruze land` updates it |

- Items are named by slug. The first item of a new project is the `walking-skeleton` standalone change.
- `Blocked by` lists slugs that must land first. The blocking graph has no cycles.
- A new release replaces `## Release` and `## Phases`. Landed items leave the roadmap once the release closes; the feature map in the vision keeps the record.
