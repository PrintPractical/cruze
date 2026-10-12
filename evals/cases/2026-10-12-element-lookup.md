# Steps read a large architecture's elements through the index, with no loss of design quality

- Proposal: `cruze show --index [<context>]` lists every element on one line, and `cruze show <ID>...` prints chosen bodies with in-flight deltas beside them. Architect, rethink, triage and the roles read the architecture's prose sections whole, find elements through the index and read the bodies they need; an architecture under 6,000 words is read whole as before.
- Evidence: in one project on Cruze 0.0.8 and 0.0.9, one architect run read 314 KB of a 52k-word `docs/architecture.md`, rethink read about 41 KB of `feature.md` per run, and design reviewers searched the architecture with `grep` and `sed` ranges for about 31 KB per run. The index of that architecture and its specs is 3,500 words.
- Asset: `src/domain/project/element_lookup.ts`, `skills/formats/reference/architecture.md`, "Reading it", `skills/architect/SKILL.md`, step 3, `skills/architect/feature.md`, steps 3 and 4

## Situation

A fixture whose architecture is over 6,000 words, with a feature whose scenarios cross existing use cases, ports and flows in two contexts, and a cross-cutting rule the design must follow. Run architect at feature scope twice: once on the release before this change, reading the architecture whole, and once on this one.

## Expected

The second run reads the Overview, Bounded contexts, Dependency rules, Cross-cutting concerns and Decisions whole, runs `cruze show --index`, and reads with `cruze show <ID>` every element a scenario's path crosses. Its delta modifies the same existing elements as the first run's, copies their current bodies, follows the cross-cutting rule, and its design review raises no more Consistency or Placement findings than the first run's. It reads less than half as many words of `docs/architecture.md`.

## Check

A fixture run, by hand, compared against the release before: the two deltas, the two design reviews' findings, and the words of `docs/architecture.md` each transcript read. The CLI behaviour is pinned by `test/element_lookup.test.ts` and the `cruze show` case in `test/cli.test.ts`.
