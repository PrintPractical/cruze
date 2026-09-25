---
name: cruze-roadmap
description: Orders the release's features and standalone changes into phases with blocking edges and goal coverage, adds or reorders items as work starts or plans change, and closes a finished release to plan the next.
---

# Roadmap

`docs/roadmap.md` is the index of the current release. It changes only when an item is added, reordered or dropped, or a release closes. The CLI keeps its managed `## Status` table current as work starts and lands. Format: `.agents/skills/cruze-formats/reference/durable-docs.md`.

## Steps

1. **Read the state.** Read `docs/vision.md` (goals and feature map), `docs/roadmap.md` and `docs/architecture.md`, and run `cruze status`. The vision must be approved. When no roadmap exists, stop: project-scope `architect` creates the first one with the walking skeleton.
2. **Pick the job.**
   - **Add an item:** a feature or standalone change the user wants in this release. Its slug comes from the feature map when it is there.
   - **Reorder or drop:** the order or scope of the release changed.
   - **Close the release:** every item in `## Status` is `landed`, or the user decides to ship what has landed.
3. **Load the standard.** Read `.agents/skills/cruze-grilling/SKILL.md`. The order of work is the user's decision, so put each ordering question to them with your recommendation.
4. **Do the job,** as described in the matching section below.
5. **Check the rules.**
   - Every item names the goals it serves.
   - `Blocked by` names only items in this or an earlier phase, and the blocking graph has no cycle.
   - Every goal the release covers has at least one item in `## Coverage`.
   - A phase holds items that can proceed in parallel once their blockers land.
   - Done when `cruze validate` reports no errors in `docs/roadmap.md`.
6. **Approve.** Show the user the phases, the blocking edges and the coverage table. When they approve the ordering, run `cruze approve roadmap` and quote its result.

## Adding an item

- Place it in the earliest phase whose items don't block it. Name its blockers: an item blocks it when it builds an element this item extends, or delivers behaviour this item changes.
- Add its slug to the coverage row of each goal it serves.
- A feature that isn't on the feature map gets there first: `cruze features add <slug> --summary <text> --goals <ids>`.

## Reordering or dropping

- Never move or drop an item whose `## Status` row shows it started (`designing` or `building`) without the user deciding what happens to its folder. The options are to finish it, or to stop it and supersede it later.
- Move a dropped feature back to the future list with `cruze features add` when it may return. When it won't, record why with `cruze features drop <slug> --reason <text>`.

## Closing the release

1. Confirm that every feature that landed shows in the vision's implemented list. `cruze land` moves each one there when its last change lands.
2. Agree the next release with the user: its name, one sentence on what it delivers, and which future features it takes from the feature map. Grill on the goals the choice serves.
3. Replace `## Release` and `## Phases` with the next release, and rebuild `## Coverage`. Run `cruze roadmap prune` to clear the landed items from `## Status`. The feature map keeps the record.

## Next step

Name the first item whose blockers have all landed:

- A feature whose requirements aren't settled: `envision "<feature>"`.
- A feature whose requirements are settled: `architect "<feature>"`.
- A standalone change whose design exists: `plan`.
- A tweak without a design yet: `architect "<tweak>"`.
