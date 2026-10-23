---
name: cruze-align
description: Brings the project's documents, every one or those the user names, up to the current Cruze format and conventions and up to date with the code, from parallel fresh-context reviews of each document, showing the user each change in meaning before approving it.
---

# Align

Documents fall behind when Cruze changes its format or conventions, and when the code moves on. Align reviews the documents the user asks for, in parallel, and changes how documents say things, or what they say about reviewed code. It never changes code, nor an approved scenario to match code that breaks it.

## Steps

1. **Start clean,** on a branch such as `docs/align` from an up-to-date `main` with nothing uncommitted. Run `cruze validate`, `cruze check` and `cruze trace`, and keep what they report. Done when you have the three reports.
2. **Review the documents the user asks for at once:** the ones they name, or every one when they ask for all or name none. Start one doc reviewer per feature file, `cruze review doc-reviewer --feature <slug>`, and one with no feature for the architecture and the vision when they are asked for, each in a fresh context as `.agents/skills/cruze-roles/SKILL.md` says, in parallel where your agent can. Done when every report is back.
3. **Check each finding** against the documents and the code, and drop one whose evidence doesn't hold, with the reason in one line. Add what step 1's reports found.
4. **Sort them:**
   - **Form:** the old format, a copy of something whose home is another document, internal types in a public API, repetition, a guide left in. Fix it; the meaning stays the same.
   - **Drift:** a document says what reviewed code doesn't do, such as a renamed port, an operation's new error, or a runtime rule that changed. Correct the document to the code.
   - **Bug:** the code breaks an approved scenario. File an issue as `.agents/skills/cruze-fix/SKILL.md` says, and leave the document as approved.
   - **The user's:** an ambiguity or a contradiction between documents that only the user can settle.

   Done when every finding has one.
5. **Apply them,** one commit per document, such as `docs(<slug>): align with the code and the formats`. Run `cruze validate`, `cruze check` and `cruze trace` again; each reports no more than in step 1.
6. **Show the user** in one message:
   - each document, with its form changes in one line;
   - each drift correction, as before and after;
   - the issues you filed;
   - the questions that are theirs, in one round, as `.agents/skills/cruze-asking/SKILL.md` says.

   End with: "Do you approve these changes, or what should change?" Apply their answers. When they approve, run `cruze approve` for each changed document that was approved before.
7. **Land it.** Open a pull request, or merge as the project does. Done when it is open or merged.

## Next step

`fix`, for the bugs filed, then `cruze next`.
