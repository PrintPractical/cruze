# Architect at tweak scope

A tweak changes existing behaviour without changing the architecture. The result is a standalone change with its intent, spec delta and scope, ready for `plan`. It has no design review and no walkthrough, because nothing structural changes; the plan review in `plan` covers it.

1. **Name the behaviour.** Find the requirements and scenarios in `docs/specs/` that the tweak changes, and the use cases that `Serve` them. Done when you can name every one.
2. **Check that it is a tweak.** Trace the new behaviour through `docs/architecture.md`. It is not a tweak when it needs a new requirement, which a use case would have to serve, or any new or changed element (an entity invariant, a use case's input or errors, a port operation, an adapter or a module). Tell the user, and continue at feature scope with [feature.md](feature.md), which puts the feature on the roadmap and creates its folder.
3. **Create the change.** Run `cruze new change <slug> --title "<title>"`, adding `--roadmap <slug>` when the tweak is a roadmap item.
4. **Settle the behaviour.** Grill the user on anything open: the exact new behaviour, its edge cases, and what a user now observes. Record decisions under the change's `## Settled decisions` as they settle.
5. **Write the design sections,** and remove every template guide, including any unused `D1` line.
   - `## Intent`: why, in the user's words, and what is out of scope.
   - `## Adopt or build`: the table header only, since a tweak adds no components.
   - `## Spec delta`: `MODIFIED` requirements with their full new bodies, including every scenario each one keeps.
   - `## Architecture delta`: `None.`
   - `## Scope`: `Delivers` lists every new or changed scenario. `Builds` stays empty unless the tweak builds `planned` elements.
   - Leave the test plan and tasks to `plan`.
6. **Confirm.** Summarize the new behaviour and ask the user to confirm it.

## A prefactor

A prefactor comes from an architecture-level rethink: the architecture already says what the code must become, and one or more built elements went back to `planned`. It changes structure, not behaviour. Create it as in step 3, then write its intent, set `## Spec delta` and `## Architecture delta` to `None.`, and list the replanned elements under `Builds`. The existing behaviour tests are its safety net: they must pass unchanged.

Done when the user has confirmed, `cruze validate` reports only the change's `not-planned` warning, and the change is committed.
