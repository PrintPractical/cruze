---
name: cruze-shape
description: Shapes one feature, or a change to features already built, with the user before it is built, from research into what the code and documents already have, writing its behaviour as scenarios, its public API as code and a sketch of how it crosses the stack, reviewed in a fresh context and approved by the user.
---

# Shape

Shape is where the user decides what a feature does and what it looks like from outside, before any code exists. It produces one document, `docs/features/<slug>.md`, and one approval, or, for a change to what exists, edits to the features it changes. Everything the user would otherwise discover at the end, such as an internal type they wouldn't have chosen, a thread they didn't expect, or a piece copied from another feature, is shown here instead.

Read `.agents/skills/cruze-asking/SKILL.md` and `.agents/skills/cruze-formats/SKILL.md`, and `.agents/skills/cruze-hexagonal-design/SKILL.md` with its language file.

## Steps

1. **Find the work.** Run `cruze next`, or take the slug or change the user names. Read its row in the vision's Release table, `docs/architecture.md`, and the feature files of what it needs. A new feature with no row gets one, with its summary and Needs, approved in step 3's question; one that clashes with a non-goal or is several features goes to envision. Work on a branch named for the feature. Done when you know what the feature is for and what it builds on.
2. **Research what exists,** in parallel helpers where you can, skipping what a brainstorm in this session already found:
   - the code: the shared modules, ports and helpers this feature can use or extend, and features that already do something alike;
   - the documents: every one that describes what this work changes, found by searching for its names;
   - the open bugs in the project's tracker against this feature and what it needs; when one breaks what this feature builds on, offer `fix` for it first;
   - when the feature drives a tool, protocol or library you haven't checked, the researcher role, as `.agents/skills/cruze-roles/SKILL.md` says.

   Done when you can list what the feature reuses, what it extends, and what it needs that doesn't exist.
3. **Decide what kind of work it is:** which documents would be wrong once it is done?
   - **A change to what exists,** when it changes what a feature does, its public API or a concept it owns, such as merging two types: edit each owning feature in place, setting a built one back to `- Status: shaped` for build, and fix the other documents step 2 found. Steps 5 to 11 run over each, reviewed in parallel and shown as before and after. A new feature that needs the change names it in its Needs.
   - **A shared piece to split out,** when it needs one that doesn't exist and other features would use, such as a kit, a port or a shared module, or won't fit one shape-and-build cycle: the piece becomes a feature of its own, a Release row ahead of this one, named in this one's Needs.

   Otherwise it is one new feature. For a change or a split, ask the user in one question, with the documents it changes or the split as a table, and what a user can do once the first piece ships, or that they can do nothing yet. When the Release row leaves the scope open, such as which cases or kinds the feature covers, ask what is in and what is out in the same question, before writing any scenario. When the work has more than one reasonable design the user would want a say in, offer to work it out together first, as a brainstorm. For a split, once they agree, edit the table, approve the vision again on their word, keep this draft, and shape the new feature first; `cruze next` holds this one until what it needs is built.
4. **Start the document** with `cruze new feature <slug> --title "<title>"`, unless it exists.
5. **Write the behaviour.** For the feature's intent, write the scenarios: the main case first, then each edge and each failure a user can meet, with concrete values. Each one is a Given, a When and a Then, in the user's words, with the exact message or output they see. Input errors that differ only in the input and the message are one scenario with a table of both.
6. **Write the public API** as real code in the project's language: what a user or another feature uses, with its errors. That is commands and their exact output, file formats, messages, and the types and functions other features call. A port's operations live in `docs/architecture.md`; name the port here and change it there. Write "No change." when the feature has none.
7. **Sketch the stack.** A plain-text diagram of the main scenario crossing the stack: the inbound adapter, the use case, the domain, each port and the adapter behind it, marking what is new and what step 2 found to reuse. Below it, one line per change to `docs/architecture.md`, such as a new port or a new runtime task, and make those changes there. Name any value the system's own components pass each other untyped or encoded, such as a JSON value, and any new thread, task or queue.
8. **Review while the user reads.** Start the doc reviewer on the feature in a fresh context, as `.agents/skills/cruze-roles/SKILL.md` says: `cruze review doc-reviewer --feature <slug>`, in the background or in a helper. While it runs, show the user the draft in one message, and say your questions follow once the review is in:
   - what the feature does, in two sentences;
   - each scenario in one line, as the user would see it;
   - the public API as code;
   - the stack sketch;
   - the decisions you took, one line each.
9. **Ask once the review is in.** Check each finding against the documents and the code, and drop one whose evidence doesn't hold. Fix the rest: a case a user can meet becomes a scenario, and an internal rule goes in the architecture's Runtime with its number. Then ask, in one round as the asking skill says, your questions together with the findings that change behaviour or the public API beyond what the user said.
10. **Fold in the answers.** Apply them, and any comments on the draft. When the scope or the public API changed after the review, review the diff again the same way. Then show what changed since the draft, from the user and from the review, counted, with each changed scenario and public API as before and after. End with: "Do you approve this feature, or what should change?" Done when the user approves.
11. **Approve and commit.** Run `cruze approve <slug>`, then commit the feature file and any architecture change with a message such as `docs: shape <slug>`.

## Changing an approved feature

Shape also runs when build finds that a scenario or the public API must change, as step 3's change. Edit the document, show the user exactly what changed, with the before and after as code or output, and approve again. `cruze status` shows the feature as edited until then.

## Next step

`build`, for the approved feature.
