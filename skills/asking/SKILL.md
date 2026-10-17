---
name: cruze-asking
description: When to ask the user and when to decide, and how to show a question so the user can answer it cold, with plain words, code sketches and diagrams. Use before asking the user anything during envision, shape, build, review or fix.
---

# Asking the user

The user's time is the scarcest thing in the project. Every question costs them a context switch, and a long run of questions turns into rubber-stamping: in one project the user answered 71% of 187 design questions with a bare "agree". So ask little, ask what only the user can answer, and show it so it can be answered at a glance.

## What to ask and what to decide

Ask when a choice changes something the user will see or live with:

- behaviour a user of the product will notice, including what they see when something fails;
- a public API: anything another program, person or team calls, types, or reads;
- scope: what is in a feature and what is out;
- a significant dependency, through `.agents/skills/cruze-dependency-approval/SKILL.md`;
- security, privacy, stored data, compatibility, or a commitment that is costly to reverse.

Decide everything else yourself: internal structure, private names, which module owns what, internal types, file layout, equivalent idioms, limits and timeouts with an obvious value. Pick the conventional option. Uncertainty alone doesn't make a choice the user's: investigate first. Then list the decisions a user might question in the document's `## Decisions`, one line each with the reason, so the user sees them when they approve, without being asked.

## How many

At most one question round per step, of five questions or fewer, before you show the document. When a choice has a sensible default, take it and list it under Decisions instead of asking. When the user defers ("you decide"), decide, and don't ask again.

## Showing a question

The user knows what the product should do, not the design's internals, and is often coming back from other work.

- **Say where things stand** in one line first: the step and the feature, such as "Shaping export-csv."
- **Explain the part before asking about it:** what it is, what it does, and why the question comes up now.
- **Use plain words.** Name a scenario or decision by what it says, and add its ID after it in parentheses only when the user may want to look it up. Never let an ID stand alone.
- **Show each option** with the form that fits:

| The question decides | Show |
| --- | --- |
| What a user does or sees | The command and its exact output, or a sketch of the screen, with real values |
| A public API or a port | A code sketch in the project's language: types, signatures, errors, and one call |
| Where something lives | A box-and-arrow diagram, or the directory tree |
| An order of steps, or what happens on failure | A numbered sequence with the failure branch |
| A stored format or config | A sample of the file |
| A dependency | The code with it and without it |

- **Keep sketches short:** shape only, bodies left out, about 15 lines per option. Draw diagrams in plain text, which reads in a terminal; documents keep their Mermaid.
- **Mark your recommendation** and why, in one line.

A shape the user chose from a sketch is part of the decision: write it into the document, so build makes it as the user saw it.

## Challenge, then defer

When the user steers toward something that breaks the architecture or a standard, name the rule, the concrete risk here and your alternative, once. Then the user decides, and their decision stands.
