---
name: cruze-shape
description: Shapes one feature with the user before it is built, writing its behaviour as scenarios, its public API as code and a sketch of how it crosses the stack, and ends with the user's approval.
---

# Shape

Shape is where the user decides what a feature does and what it looks like from outside, before any code exists. It produces one document, `docs/features/<slug>.md`, and one approval. Everything the user would otherwise discover at the end, such as an internal type they wouldn't have chosen or a thread they didn't expect, is shown here instead.

Read `.agents/skills/cruze-asking/SKILL.md` and `.agents/skills/cruze-formats/SKILL.md`, and `.agents/skills/cruze-hexagonal-design/SKILL.md` with its language file.

## Steps

1. **Find the feature.** Run `cruze next`, or take the slug the user names. Read its row in the vision's Release table, `docs/architecture.md`, and the feature files of what it needs. Work on a branch named for the feature. Done when you know what the feature is for and what it builds on.
2. **Start the document** with `cruze new feature <slug> --title "<title>"`, unless it exists.
3. **Write the behaviour.** For the feature's intent, write the scenarios: the main case first, then each edge and each failure a user can meet, with concrete values. Each one is a Given, a When and a Then, in the user's words, with the exact message or output they see. Invent the edge cases a user would hit: empty input, a duplicate, the thing not there, the network gone, the limit reached.
4. **Write the public API** as real code in the project's language: every public type, function, command, endpoint, message or file format this feature adds or changes, with its errors. For a command-line tool, the commands and their exact output. Write "No change." when the feature has none.
5. **Sketch the stack.** A plain-text diagram of the main scenario crossing the stack: the inbound adapter, the use case, the domain, each port and the adapter behind it, marking what is new. Below it, one line per change to `docs/architecture.md`, such as a new port or a new runtime task, and make those changes there. Name any value the system's own components pass each other untyped or encoded, such as a JSON value, and any new thread, task or queue.
6. **Check it yourself** against [self-check.md](self-check.md), and fix what it finds. Done when every item passes.
7. **Ask what only the user can answer,** in at most one round, as the asking skill says. Write the answers in.
8. **Show it.** In one message:
   - what the feature does, in two sentences;
   - each scenario in one line, as the user would see it;
   - the public API as code;
   - the stack sketch;
   - the decisions you took, one line each.

   End with: "Do you approve this feature, or what should change?" Apply changes, and say what moved. Done when the user approves.
9. **Approve and commit.** Run `cruze approve <slug>`, then commit the feature file and any architecture change with a message such as `docs: shape <slug>`.

## Changing an approved feature

Shape also runs when build finds that a scenario or the public API must change. Edit the document, show the user exactly what changed, with the before and after as code or output, and approve again. `cruze status` shows the feature as edited until then.

## Next step

`build`, for the approved feature.
