---
name: cruze-build
description: Builds the change bound to this branch task by task, each one test-first, checked with cruze check and committed, stopping to rethink when reality diverges from the design.
---

# Build

Build turns an approved plan into code, one task at a time. Each task starts with a failing test at the seam the plan names and ends as a green, checked commit. The design is settled, so build follows it. When the code shows the design is wrong, build stops and says so.

## Steps

1. **Pass the gate.** Run `cruze status --gate build` and quote its result.
   - When it is blocked, stop, and show the reasons with the step that fixes them (`cruze next` names it).
   - Override it only when the user explicitly asks, with `cruze status --gate build --override "<their reason>"`. The override is journaled.
2. **Load the standards.** Read these, and follow them for every task:
   - `.agents/skills/cruze-behavioural-testing/SKILL.md`
   - `.agents/skills/cruze-hexagonal-design/SKILL.md`, and its language file when one exists for the project's language
   - `.agents/skills/cruze-dependency-approval/SKILL.md`
3. **Read the plan and the design.** Read the change's `change.md` and its feature's `feature.md`. Read the full body of every element the change builds, and every scenario it delivers. Read `commands:` in `.cruze/config.yaml`.
4. **Build each open task in order,** following the task loop below. Skip the tasks already ticked in `## Progress`.
5. **Finish.** When every task is ticked:
   - Run the full test suite, the formatter and the linter, using the project's commands.
   - Run `cruze check` and `cruze trace`, and quote their results.
   - Commit the progress record with a message such as `chore: record progress on <change>`.
   - Done when all of them pass.

## The task loop

For task `T<n>`:

1. **Read it.** Note its owner, its files, the IDs it proves, and the test plan rows for those IDs.
2. **Red.** Write the tests for the IDs it proves, at the seams the test plan names, carrying the IDs. Run them, and see them fail for the reason you expect.
3. **Green.** Write the least code that makes them pass, in the task's files. Code that belongs to another task waits for that task.
4. **Check.** Run `cruze check <the task's files>`, the formatter and the linter, and fix what they report. Run the tests the task touched, and the rest of the suite when they are quick.
5. **Commit** with a Conventional Commit message naming the task, such as `feat(access): console session state machine (T2)`.
6. **Tick it.** Run `cruze task done T<n>`, which records the commit. Its progress edit rides along in the next commit.

A task with no behaviour of its own, such as a package manifest or a plain data type, has no red step. Build it, check it, commit it and tick it, and the first task whose test uses it covers it.

Done for a task when its tests pass, `cruze check` passes for its files, the commit exists and the task is ticked.

## Deviations

The plan is design. Within a task you decide only what is local and reversible.

- **Record it and carry on** for a task-level choice: a private helper in another file of the same module, a private type, or two tasks' commits swapped for a reason. Run `cruze task deviation T<n> "<what you did and why>"`.
- **Stop and offer `rethink`** when the code needs any of these:
  - a new element, port operation or scenario;
  - a file outside the owner's module;
  - a change to an approved scenario's behaviour, or to its test;
  - a dependency the design doesn't name.

  Explain what you found, with the evidence, and don't work around it. Completed tasks keep their commits.
- Never edit `feature.md`, `docs/architecture.md` or `docs/specs/` during build. Design changes go through `rethink`.

## Protecting the check

Never weaken, skip or delete a behaviour, contract or smoke test for an approved scenario, port or flow to get green. A failing one means the code is wrong, or the spec is. A wrong spec goes through `rethink`.

## Next step

`verify`, once every task is ticked and the finishing checks pass.
