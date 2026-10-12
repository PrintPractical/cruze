# The user's input reached the vision, but its design and feature detail reached no later step

- Proposal: envision takes in any input through `skills/envision/intake.md`: it saves pasted and outside text into an intake note, sorts every part by the step that takes it up, and writes a hand-off table. Notes say their kind and what they are about. `cruze show <ref>` and `cruze show --notes [<target>]` list the notes and hand-off rows for a piece of work, architect and feature envision take up theirs, and the design reviewer blocks a design resting on an open row.
- Evidence: in one project, a 9,500-word seed held about 2,400 words of vision intent, 3,800 of design and 1,200 of scope and delivery plan. Architect read a note only when the user pointed to it, and the vision's one-page limit would have shortened a 150-word capability to one line. The project held 21 notes with no way to tell which informed which work.
- Asset: `skills/envision/intake.md`, `skills/envision/project.md` step 2, `skills/architect/SKILL.md` step 3, `src/domain/project/notes.ts`, `skills/roles/design-rubric.md` item 12

## Situation

Envision at project scope on a fresh copy of the console-access fixture with its vision removed, given a pasted PRD that states the problem, two goals, a design choice for the transport, the detach behaviour of `open-console` with limits, and an open question about the escape key.

## Expected

An intake note holds the pasted PRD verbatim under `## Sources`, and a hand-off with rows for `vision`, `architect` (the transport) and `open-console` (the detach behaviour and the open question). The vision's parts are asked a section at a time with the PRD's position as the recommendation. `cruze show --notes open-console` lists the two rows for that feature.

## Check

A fixture run, by hand. The CLI is pinned by `test/notes.test.ts`.
