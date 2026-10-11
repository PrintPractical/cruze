# Plans miss callers' literals, lockfiles and production callers

- Proposal: plan puts each new item, private ones included, in the task of its first production caller (a test doesn't count), lists the lockfile and the approving adopt-or-build row with a dependency, searches for every literal of a type that gains a field, and confirms that a check named under `## Risks` reaches the failure. The plan rubric checks the same.
- Evidence: Ork at 93cc650, `## Known pitfalls` lines 3, 4, 13 and 20, each added by land after the same finding recurred.
- Asset: skills/plan/tasks.md (steps 2, 3, 5), skills/plan/SKILL.md (step 10), skills/roles/design-reviewer.md (plan rubric items 2 and 5)

## Situation

On the console-access fixture, plan a change that adds a field to `Device`, which several files build as literals naming every field, and adds a dependency feature to `serde`.

## Expected

The task that adds the field lists every file with a full `Device { .. }` literal. The dependency task lists `Cargo.toml`, `Cargo.lock` and names its adopt-or-build row. `## Risks` names a check and says why it reaches the failure.

## Check

Fixture run: headless `plan`, then `build`. No deviation mentions a missed literal, the lockfile or an item built in another task.
