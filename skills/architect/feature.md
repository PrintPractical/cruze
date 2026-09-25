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
6. **Research and decide.** For each new component that isn't domain logic, run the researcher role and record a row in `## Adopt or build`. Take every new dependency to the user.
7. **Keep later seams open.** When the feature map shows a later feature that will extend this area, record the seam in a `Future` fact, and don't build it.
8. Done when `cruze validate` reports no errors in the delta itself, and every cited ID exists in the living docs or this delta.

## Split it into changes

9. **Slice vertically.** Each change delivers one or more scenarios end to end, through every layer they need, and can land on its own. The first change is the thinnest slice that proves the design, a tracer bullet. Later changes widen it.
10. **Fill the Changes table.** Give each row a number and a slug, such as `01-local-serial`. List the scenario and requirement IDs it `Delivers`, the architecture IDs it `Builds`, any IDs it `Removes`, and the changes it `Depends on`.
11. **Cover everything exactly once.** Every delta ID appears in exactly one change. A module the delta adds, or one still `planned` in the living docs, is built by the first change that writes a file in it. A module already `built` isn't listed. Done when `cruze validate` reports no errors for the feature, and no `not-designed` warning.
12. **Size each change.** A change that would need more than about 12 tasks, or touches more than one context's domain, splits in two.

Then continue with the review and walkthrough steps of the skill. When the user approves, run `cruze approve <feature>` and quote its result. The command takes the feature's full ID, such as `2026-09-25-open-console`, or its slug when no other active item shares it.
