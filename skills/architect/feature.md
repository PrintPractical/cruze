# Architect at feature scope

The result is a `feature.md` with a complete architecture delta and an ordered list of changes, approved at the walkthrough. Formats: `.agents/skills/cruze-formats/reference/work-items.md` and `.agents/skills/cruze-formats/reference/architecture.md`.

## Settle what it does

1. **Find the feature folder.** When `envision "<feature>"` created one, read its intent, settled decisions and spec delta.
2. **Or settle it now.** When there is no folder, follow `.agents/skills/cruze-envision/feature.md` from its step 2 up to, but not including, its step 8. That puts the feature on the roadmap, checks its blockers, creates the folder and settles the intent and spec delta.

## Design the delta

3. **Trace each scenario through the model.** For every scenario in the spec delta, name the inbound adapter it enters through, the use case that runs it, the domain elements that decide it, and the ports it crosses. Done when every scenario has a path, and each missing piece is a named gap.
4. **Place each gap,** following "Placing an owner" in the hexagonal-design skill. Prefer extending an existing element when it is the right owner. Each change to the living model becomes an operation under `## Architecture delta`:
   - `ADDED` for a new element, with its full body.
   - `MODIFIED` for an existing element, with its full new body. Copy the current body from `docs/architecture.md` and edit it, so nothing is lost by accident.
   - `REMOVED` with a `Reason`, for an element the feature retires.
5. **Link behaviour to design.** Each use case that runs a requirement lists it under `Serves`. Add or modify a `FLOW` for each key scenario, with `Serves` naming its scenarios and the failure paths they need.
6. **Research and decide.** For each new component that isn't domain logic, run the researcher role and record a row in `## Adopt or build`. Take every new dependency to the user. Then verify every claim the design relies on, following step 7 of adopt or build in `.agents/skills/cruze-research/SKILL.md`. Done when no claim in the design is unverified.
7. **Keep later seams open.** When the feature map shows a later feature that will extend this area, record the seam in a `Future` fact, and don't build it.
8. Done when `cruze validate` reports no errors in the delta itself, and every cited ID exists in the living docs or this delta.

## Split it into changes

9. **Slice vertically.** Each change delivers scenarios end to end, through every layer they need, and can land on its own. Every change pays for its own plan review, code review, verifier run and land, so slice by what is worth that cost, not by the smallest piece that could land. The feature's first change proves the design end to end; later changes widen it in steps of real work.
10. **Fill the Changes table.** Give each row a number and a slug, such as `01-local-serial`. List the scenario and requirement IDs it `Delivers`, the architecture IDs it `Builds`, any IDs it `Removes`, and the changes it `Depends on`.
    - A change builds an element only when its scenarios prove the whole element. Each delta element is built by exactly one change, so when an element's duties arrive in different changes, split it into elements that each arrive whole, such as frame limits split out of a concurrency rule.
    - `Depends on` names every earlier change that builds something this change's scenarios need.
11. **Cover everything exactly once.** Every delta ID appears in exactly one change. A module the delta adds, or one still `planned` in the living docs, is built by the first change that writes a file in it. A module already `built` isn't listed. Done when `cruze validate` reports no errors for the feature, and no `not-designed` warning.
12. **Size each change, and the feature.** Aim for changes of about 8 to 25 tasks, each one a sitting's worth of review and verify:
    - **Merge** a change that builds fewer than 3 elements into the change it continues, when they share adapters or screens, or form a chain where each depends on the one before. Several small changes to the same screens are one change. `cruze validate` warns `change-too-small`.
    - **Split** a change that delivers more than 30 scenarios, or would need more than 25 tasks, or touches more than one context's domain. One verifier run and one code review can't hold more. `cruze validate` warns `change-too-large`, and `plan-too-large` once a plan passes 25 tasks.
    - A feature of more than 6 changes is more than one design review can hold: split it into features that each serve part of its goals, and run `cruze features add` for the later ones. `cruze validate` warns `feature-size` until it is split.

    The thresholds are the defaults under `changes:` in `.cruze/config.yaml`; a project can tune them.

    Done when `cruze validate` reports no `change-too-small`, `change-too-large` or `feature-size` warning. When the user accepts one, record it twice: a `D<n>` line under the feature's `## Settled decisions` saying why, and the item under `changes.exceptions` in `.cruze/config.yaml` with the same reason, which is what stops the warning. `cruze approve` refuses an item with a warning still standing (`size-unaccepted`). After approval, only a rethink can split a change.

Then continue with the review and walkthrough steps of the skill. When the user approves, run `cruze approve <feature>` and quote its result. The command takes the feature's full ID, such as `2026-09-25-open-console`, or its slug when no other active item shares it.
