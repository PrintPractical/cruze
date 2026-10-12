# Taking in the user's input

The user may bring anything: a seed, a PRD, a TRD, a design write-up, an old project's notes, a pasted paragraph or a link. Everything in it is open for discussion, and every part of it reaches the step that takes it up. One project's 9,500-word seed held design that no step was told to read, and intent the vision had no room for.

1. **Gather it.** Read every source the user names or pastes, and each note `cruze show --notes` lists with kind `input`. Run `cruze new note intake --title "Intake: <what the input is>" --kind intake --about project`. Under `## Sources`, cite each file in the repository by path, and copy in, verbatim, what would otherwise be lost: pasted text, and a document outside the repository, such as a link or a PDF.
2. **Sort every part** by the step that takes it up. Name each part by its heading, or by a short quote where the input has none:
   - `vision`: the problem, users, goals, non-goals, constraints, principles, and what must stay possible.
   - `architect`: design choices, such as structure, protocols, technologies and data formats.
   - `roadmap`: delivery order and phases.
   - a feature's slug: one feature's behaviour, rules, limits and examples. Use the slug the feature map gives it.
   - `user`: preferences about the process itself, which the user may add to `AGENTS.md`.

   An open question goes to the step that settles it. Done when every part of every source has a place.
3. **Read its stance.** Note how settled the input says each part is, from its own legend when it has one, or from its wording: "we decided" and "must" are firmer than "maybe", "TBD" or a question. Nothing is settled by being written down. The stance sets only your recommendation: keep what the input settled, with its reason; ask about what it proposed; research what it guesses; settle what it leaves open.
4. **Write the hand-off** in the intake note, under `## Hand-off`, one row per part:

   ```markdown
   | Part | Source | Goes to | Status |
   | --- | --- | --- | --- |
   | Transport | `.cruze/notes/2026-10-12-seed.md`, "The protocol" | architect | open |
   ```

   A one-paragraph idea is all `vision`, so its hand-off is a row or two.
5. **Take up the vision's parts now,** one section at a time. Each section is one question, keep or change, with the input's position as your recommendation. Set each row's status to `settled` or `dropped` as the user decides.

## Taking up a hand-off later

Architect, the roadmap and feature-scope envision take up their own rows. `cruze show --notes <step or feature slug>` lists them, and `cruze show <ref>` lists them for a feature or change. Read each part at its source, ask the user about it as in step 5, record what they keep where the step records decisions, and set the row's status. A row still `open` when the step ends goes to the user: keep it open for a later step, or drop it.
