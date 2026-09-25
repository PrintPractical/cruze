---
name: cruze-plan
description: Turns the next change into a test plan and ordered tasks with file targets, reviews the plan in a fresh context, and records your approval on the branch that will build it.
---

# Plan

Plan turns one designed change into work an implementer can do without guessing: which test proves each scenario, at which seam, and which file each task writes. Every change arrives from `architect`, so plan makes no design decisions. A plan that needs one sends the change back.

## Steps

1. **Find the change.** Run `cruze next`. Plan the change it names, or the one the user names. It is either a feature's next change, whose row has no folder yet and whose dependencies have landed, or a standalone change that `architect` designed. Done when you can name the change and its feature.
2. **Check what it builds on.** `cruze status` must show the architecture approved and current, along with the feature when there is one. When something isn't, stop and name the step that fixes it, as `cruze next` does.
3. **Start its branch.** From an up-to-date main that holds every change this one depends on, create a branch named for the change, such as `open-console-local-serial`, and switch to it. A branch holds one active change.
4. **Create the change.**
   - For a feature's change, run `cruze new change <slug> --feature <feature> --title "<title>"`. It copies the scope from the feature's Changes row.
   - A standalone change already exists; plan its empty test plan and tasks.
5. **Load the standards.** Read these, and follow them for the rest of this step:
   - `.agents/skills/cruze-behavioural-testing/SKILL.md`
   - `.agents/skills/cruze-hexagonal-design/SKILL.md`, and its language file when one exists for the project's language
   - `.agents/skills/cruze-formats/reference/work-items.md`
6. **Read the design it builds.** Read the full body of every element in the scope, from the feature's delta or `docs/architecture.md`, and every scenario it delivers.
7. **Check for overlap.** Run `cruze status --overlap --change <ref>`. For each change on another branch that touches the same elements, tell the user which elements are shared and which change should land first. Record the answer under `## Risks`.
8. **Write the test plan.** Follow [test-plan.md](test-plan.md). Done when every delivered scenario has a `behaviour` row and every port a built adapter implements has a `contract` row.
9. **Write the tasks.** Follow [tasks.md](tasks.md). Done when every scope ID is proved by a task and every task line matches the grammar.
10. **Record decisions and risks.** Put task-level choices you made under `## Settled decisions`. Under `## Risks`, name the riskiest task and how its test catches the failure. Remove every template guide.
11. **Validate.** Run `cruze validate`. Done when it reports no errors for the change.
12. **Review the plan.** Commit the plan, then run the review in `.agents/skills/cruze-roles/SKILL.md` with the design reviewer and its plan rubric, `review=plan`, and `--item <ref>`.
13. **Approve.** Show the user the test plan table, the tasks in order and the risks. When they approve, run `cruze approve <ref>` on this branch and quote its result. The approval binds the change to the branch.
14. **Commit** with a message such as `docs: plan <change>`.

## When the plan needs design

Stop planning when you find you need any of these:

- a new element, or a new operation on a port;
- a file the architecture doesn't assign to the owner;
- a scenario that isn't in the spec delta;
- a dependency that isn't in `## Adopt or build`.

Say what is missing and why, then send the change to `rethink` at feature level. For a standalone change, that means its own deltas. Never add design to `change.md`.

## The walking skeleton

The walking-skeleton change also makes CI and the project's tooling real. Its plan adds:

- `commands:` in `.cruze/config.yaml`: the format, lint, build, test and run commands, as the language's standard tooling runs them.
- A task that adds the language's format, lint, build and test steps to CI (`.github/workflows/ci.yml`), before the Cruze steps `cruze init` put there. The task proves the flow its smoke test runs.

## Next step

`build`, on this branch.
