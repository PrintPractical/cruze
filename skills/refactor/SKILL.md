---
name: cruze-refactor
description: Restructures existing code without changing what it does, from the user's request or an issue, in small steps that keep the scenarios' tests green, reviewed in a fresh context, going to the user only when the architecture or an approved public API changes.
---

# Refactor

A refactor changes how the code is built, not what it does. The scenarios and their tests already say what it does, so they are the safety net: green at every step, and none weakened. The user decides only what they approved, the architecture map and each feature's public API. Everything else is yours.

## Steps

1. **State the goal** from the user or the issue: what is wrong with the structure now, such as a module with two responsibilities, a domain rule in an adapter, or the same logic in two features, and what it looks like after. Done when you can say both in two sentences.
2. **Map the change.** List each thing that moves, splits, merges or is renamed, and sort it:
   - **The architecture:** a port, an adapter, a layer or the runtime model that `docs/architecture.md` describes.
   - **A public API:** a type, function, command, flag or output that a feature's `## Public API` lists.
   - **Yours:** everything else, such as modules, files, private types and helpers.

   Done when every item is sorted.
3. **Ask the user only about theirs,** in one round, as `.agents/skills/cruze-asking/SKILL.md` says: the architecture map before and after, and each public API before and after as code, with what a caller must change. Edit the documents once they agree, and run `cruze approve architecture` or `cruze approve <slug>`, as shape's "Changing an approved feature" at `.agents/skills/cruze-shape/SKILL.md` says. When nothing is theirs, ask nothing.
4. **Check the safety net** on a branch such as `refactor/<slug>`. Run the full suite and `cruze trace`; both pass before you change anything. Where code you will move does something no test covers, add a test at the seam `.agents/skills/cruze-behavioural-testing/SKILL.md` names, and see it pass. Done when every behaviour of the code you will move has a passing test.
5. **Refactor in small steps.** Each step is one move, such as extract, inline, rename or move, after which the build, the full suite and `cruze check` pass, and is its own commit. When a step breaks a test, undo it and take a smaller one. Change a test only to follow the code it names, such as a moved path or a renamed type, never its inputs or expected values. Done when every item of the map is done.
6. **Update what describes the old structure:** `docs/architecture.md`, the stack sketches of the features you touched, `layers:` in `.cruze/config.yaml`, and the layout in `AGENTS.md`. Show the user each change to an approved document that step 3 didn't cover, with your report, for them to approve.
7. **Finish.** Run the formatter, the linter, the build, the full suite, `cruze check --ci` and `cruze trace`. Done when every one of them passes.
8. **Review it:** run the code reviewer on the refactor's diff, as `.agents/skills/cruze-review/SKILL.md` says, with `cruze review code-reviewer --base <merge-base>` and no feature, and fix what it finds.
9. **Land it.** Use commit messages such as `refactor(<scope>): <what moved>`. Tell the user in a few lines what moved and why, and that behaviour is unchanged. Add a line under `[Unreleased]` in `CHANGELOG.md` only when a public API changed. Open a pull request or merge as the project does.

## Rules

- Behaviour stays the same. A bug you find becomes an issue, as `.agents/skills/cruze-fix/SKILL.md` says; a behaviour you would improve goes to the user as a suggestion.
- Keep to the goal. Other structure worth changing becomes an issue that a later refactor starts from.

## Next step

`cruze next`.
