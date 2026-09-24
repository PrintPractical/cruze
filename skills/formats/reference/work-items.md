# Feature and change format

Work in progress lives in `.cruze/`. A **feature** carries the design: its intent, its deltas and the ordered list of its changes. A **change** is one buildable slice: its scope, its test plan and its tasks. A small tweak is a **standalone change** that carries its own deltas. When work lands it is archived, and its deltas become part of the living docs.

Templates: `../templates/feature.md`, `../templates/change.md` and `../templates/standalone-change.md`.

## IDs and folders

- Features and standalone changes get an ID from `cruze new`: the creation date plus a slug, such as `2026-09-25-jump-hosts`. The CLI adds `-2` on a same-day clash.
- A feature's changes are numbered inside the feature, as in `01-ssh-hop` and `02-serial-behind-hop`. The full reference is `<feature id>/<change>`.
- Frontmatter holds `id`, `title` and, for features, `roadmap` (the roadmap item slug). A retry of an abandoned or superseded item adds `supersedes: <old id>`.

## feature.md

| Section | Holds |
| --- | --- |
| `## Intent` | The problem and outcome in the user's words, who it is for, constraints, and what is out of scope |
| `## Settled decisions` | Decisions the user confirmed, one bullet each as `D<n>: <decision> (<reason>)`, including overrides of Cruze's advice |
| `## Adopt or build` | Table of components that aren't domain logic, as Component, Decision (`adopt` or `build`), Choice and Reason |
| `## Spec delta` | See `specs.md` |
| `## Architecture delta` | See `architecture.md` |
| `## Changes` | Table of the ordered changes, as Change, Delivers, Builds and Depends on |
| `## Progress` | Managed: state of each change, landed commits and the deviation log |

## change.md

| Section | Holds |
| --- | --- |
| `## Scope` | `- Delivers:` scenario and requirement IDs, `- Builds:` architecture IDs, `- Removes:` IDs retired by this change |
| `## Test plan` | Table of Subject, Seam, Test file and Kind, one row per delivered scenario and per contract-tested port |
| `## Tasks` | One task line per task, in build order |
| `## Settled decisions` | Decisions made while planning this change, same format as the feature |
| `## Risks` | What could break and the riskiest task, when there are any |
| `## Progress` | Managed: ticked tasks with their commits, deviations and the bound branch |

A standalone change adds `## Intent`, `## Spec delta` and `## Architecture delta` before its `## Scope`. Its scope covers every ID in its own deltas, plus any `planned` elements from the living docs that it builds.

## Scope rules

These rules close the gap between a design and what gets built. `cruze validate` checks them.

- Every ID in a feature's deltas appears in the scope of exactly one of its changes. For a standalone change, that is its own scope. A `MODIFIED` or `REMOVED` requirement is covered by its ID or by one of its scenarios.
- A scope may also name elements already in the living docs with status `planned`, such as a walking-skeleton change that builds elements the project architecture defined.
- When a change lands, `land` merges the delta operations its scope covers. It sets delivered scenarios and built elements to `built`. Other scenarios of a merged requirement arrive as `planned`, to be delivered by a later change.
- The `Changes` table and each change's `Scope` agree. `plan` copies the row into the change and refines it; a disagreement is a validation error.

## Test plan

| Kind | Subject | Seam |
| --- | --- | --- |
| `behaviour` | a `SCN` ID | the use case it runs through, with a fake named for each driven port; or the inbound adapter, when the outcome is what that adapter shows, such as CLI output and exit codes |
| `contract` | a `PORT` ID | the port, run against its fake and each real adapter |
| `domain` | an `ENT` ID | the entity's own API, only for rules with real logic |
| `smoke` | a `FLOW` ID | the real inbound adapter, end to end |

Every delivered scenario has at least one `behaviour` row. The test file path is where the test will live. The subject ID appears in the test's name, or in a comment on the line directly above it when the language's names can't hold an ID. That is how `cruze trace` finds it.

## Task lines

```markdown
- T1: `HopConnector` port in `src/access/app/ports/hop_connector.rs`, proves PORT-access.hop-connector
- T2: `SshConnector` in `src/access/adapters/ssh_connector.rs`, proves PORT-access.hop-connector, SCN-access.ssh-through-jump-host
```

- Grammar: `- T<n>: <owner> in <path>[, <path>], proves <ID>[, <ID>]`. Owner and paths are in backticks.
- One owner per task, and every path names a file the architecture assigns to that owner.
- Every scenario the change delivers is proved by at least one task, and so is every `Builds` element. The exception is a `MOD`, which is proved by any task with a path inside the module's `Path`.
- Tasks are design, not progress. Their checkboxes live in `## Progress`.

## Progress

The managed block the CLI maintains:

```markdown
<!-- cruze:managed -->
## Progress
- Branch: jump-hosts-ssh
- [x] T1 (a1b2c3d)
- [ ] T2
- Deviation T1: moved `HopError` into `hop_connector.rs`; same owner, same module
<!-- /cruze:managed -->
```

A deviation line records a task-level choice the agent made on its own. Anything larger goes through `rethink`.

## Other files in a change folder

- `manual-test.md`, written by `verify`: numbered steps a person runs against the real system, one section per delivered scenario, each with its expected result.
- `approvals.json` and `journal.jsonl`, written only by the CLI.
