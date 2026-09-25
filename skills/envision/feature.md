# Envision at feature scope

The result is a feature folder whose `feature.md` holds the intent, the settled decisions and the spec delta, ready for `architect`. Formats: `.agents/skills/cruze-formats/reference/work-items.md` and `.agents/skills/cruze-formats/reference/specs.md`.

1. **Check the project.** `cruze status` must show `docs/vision.md` approved. If it isn't, stop and run envision at project scope first.
2. **Find the feature.** Look for it in the roadmap's phases and on the feature map's future list.
   - When it isn't in the roadmap's phases, ask the user whether it belongs in this release. If it does, add it by following "Adding an item" in `.agents/skills/cruze-roadmap/SKILL.md`, and re-approve the roadmap. If it doesn't, put it on the future list with `cruze features add` and stop here.
   - When its `Blocked by` items haven't landed (see the roadmap's `## Status`), tell the user. Continue only if they want to design ahead, and record that as a settled decision.
3. **Create the folder.** When the feature has no folder yet, run `cruze new feature <slug> --title "<title>" --roadmap <slug>`, using its roadmap slug. When a folder exists, edit its `feature.md`.
4. **Read the behaviour it touches.** Read the specs in `docs/specs/` for every capability the feature changes, so you know each requirement and scenario it builds on.
5. **List the open decisions:**
   - **Intent:** the problem and outcome in the user's words, who it is for, the constraints, and what is out of scope.
   - **Requirements:** each behaviour the feature adds, changes or removes, and the capability it belongs to. It goes in an existing capability when the behaviour fits one; otherwise it starts a new capability.
   - **Scenarios:** for each requirement, the main case, each edge and failure case a user will meet, and what they observe in each. Invent concrete edge cases to test the boundaries.
6. **Grill in rounds** until every open decision is settled. Record decisions under `## Settled decisions` and terms in the glossary as they settle.
7. **Write the spec delta.** Use `ADDED` for new requirements, `MODIFIED` for a requirement whose text or scenarios change (writing its full new body with every scenario it keeps), `REMOVED` with a `Reason` and `Migration` for retired behaviour, and `ADDED CAPABILITY` for a new capability.
   - Name every ID with glossary terms. An ID is never reused.
   - Done when every requirement has a scenario for its main case and one for each failure a user can meet.
8. **Leave the design to architect.** Set `## Architecture delta` to `None.` and leave the Changes table with its header row only. Remove the remaining template guides.
9. **Confirm.** Summarize the intent and each requirement with its scenarios, in plain words, and ask the user to confirm them. Apply any corrections.

Done when the user has confirmed, `cruze validate` reports no errors for the feature, only its `not-designed` warning, and the feature is committed.
