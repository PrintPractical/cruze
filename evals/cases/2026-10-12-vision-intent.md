# Long-term intent lived in a seed note and the user's head, and the design drifted from it

- Proposal: the vision holds `## Principles` (`PRINCIPLE-` rows) and `## Must stay possible` (`LATER-` rows), which designs cite and approvals pin. Grilling sends "eventually" intent and departures from a principle to the vision, from any step. The design reviewer checks each design against both (rubric item 12), and the surveyor respects them.
- Evidence: Ork. The seed's principle "events are lossy, never used for control logic" never reached `docs/`. On 2026-10-10 the user answered "I could see eventually policy orchestrators wanting to react to specific events, so I actually think this is a yes", which was recorded as an orchestration-runtime decision and archived. Downloadable apps and orchestrators that react to telemetry appeared nowhere until the restart review of 2026-10-12 proposed removing the catalog, event-driven reconciles and ephemeral sets those plans needed.
- Asset: `src/domain/validation/vision_rules.ts`, `src/domain/ids.ts`, `skills/formats/templates/vision.md`, `skills/grilling/SKILL.md`, "Long-term intent", `skills/roles/design-reviewer.md`, "Rubric", item 12, `skills/roles/surveyor.md`

## Situation

On the console-access fixture, the architecture cites `LATER-shared-sessions` in a `Future` fact, and the vision changes that row.

## Expected

The citation validates, a misspelled `LATER` ID is `unknown-id`, malformed rows are `vision-row`, and after the vision is re-approved the architecture shows `upstream-changed` naming `LATER-shared-sessions`.

## Check

Tests: `test/vision_intent.test.ts`, and the `vision-row` cases in `test/validate.test.ts`.
