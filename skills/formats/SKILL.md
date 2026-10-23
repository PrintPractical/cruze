---
name: cruze-formats
description: The formats of every Cruze project document, with templates. Use when reading, writing or reviewing docs/vision.md, docs/architecture.md, docs/features/, or .cruze/config.yaml in a Cruze project.
---

# Cruze document formats

A Cruze project has three kinds of document, all Markdown that people read and `cruze` parses. Create each with `cruze new`, which starts it from its template ([vision](templates/vision.md), [architecture](templates/architecture.md) or [feature](templates/feature.md)), and replace every `<angle-bracket>` guide. `cruze validate` reports what drifts.

| Path | What it holds | Written by |
| --- | --- | --- |
| `docs/vision.md` | The problem, users, terms, the release's features and what each needs, future features and what must stay possible, non-goals, constraints | envision |
| `docs/architecture.md` | The map: an overview diagram, ports with their operations, adapters, the runtime model, technology, layers, decisions | envision; shape when a feature moves a boundary |
| `docs/features/<slug>.md` | One feature: intent, behaviour as scenarios, public API as code, a stack sketch, decisions | shape; build marks it built |
| `.cruze/config.yaml` | Project configuration; see [config.md](config.md) | `cruze init`, the foundation feature |

Only `cruze approve` writes `.cruze/approvals.json`.

## The vision's Release table

`## Release` holds a table with the columns `Feature | Summary | Needs`, one row per feature of the release, in the order they should be built. Feature is the slug of its `docs/features/` file. Needs lists the slugs, comma-separated, of the features it can't be built without; leave it blank when there are none. `cruze next` picks the first feature not yet shaped whose needs are all built, and `cruze validate` refuses an unknown slug and a circle of needs.

`## Future features` uses `Feature | Summary | Must stay possible`. These shape boundaries in the architecture; nothing is built for them until they join a release.

## Features

A feature file starts with its title and a status line:

```markdown
# Sign in

- Status: shaped
```

The status is `shaped` until build finishes the feature, then `built`. The sections are `## Intent`, `## Behaviour`, `## Public API`, `## Stack sketch` and `## Decisions`, in that order.

Each scenario under `## Behaviour` is a heading `### SCN-<slug>.<name>: <title>`, where `<slug>` is the feature's and `<name>` is lowercase words joined by hyphens, followed by Given, When and Then bullets in the user's words. A scenario ID is never reused, even after its scenario is removed, and the test that proves a scenario carries its ID in a comment or string, such as `// SCN-sign-in.wrong-password`. `cruze trace` fails when a built feature's scenario has no test, or a test names a scenario no feature defines.

Work that changes what a feature does edits that feature's file in place, rather than adding a feature, and sets a built one back to `shaped`; git keeps the history.

## One home for each thing

Write each thing once, and name it everywhere else, so no copy drifts from the code:

- A port's operations, with their errors, live in `docs/architecture.md`. A feature names the port and changes its operations there.
- A public API lives in the feature that introduced it: what a user or another feature uses, such as commands and their output, file formats, messages, and the types and functions other features call. Internal types and modules aren't part of it.
- A runtime rule or limit that crosses features lives in the architecture's Runtime.

## Approvals

`cruze approve <vision|architecture|slug>` records a hash of the document's content as the user approved it. Any later edit shows it as `edited` in `cruze status` until it is approved again. The status line and a feature's `## Decisions` are left out of the hash, so marking a feature built or recording a decision never counts as an edit. Approve only on the user's word.

## Size

A document is for a person to read. Leave out what the agent decided that the user needn't read, and split a feature that has grown past one shape-and-build cycle. No length is enforced, so never trim a document to a word count.

## Keeping documents current

Cruze's changelog says when a release changes the format, which `cruze` parses, or the conventions this skill describes. The `cruze-align` skill brings every document up to both, and up to date with the code.
