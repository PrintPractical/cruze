# A capability that must stay possible was checked only by designs in its own area

- Proposal: architect and the design reviewer check every design against every `LATER` row, whatever its area, and a `Future` fact may sit on any element; `cruze validate` warns `future-unanchored` on one that names no need.
- Evidence: in one project, a capability needed configuration from a peer device and one firmware in several roles. Both constrain configuration layering and startup, which a configuration feature would not see as the capability's area. The format allowed `Future` only on ports.
- Asset: `skills/architect/SKILL.md`, `skills/architect/feature.md` step 7, `skills/roles/design-rubric.md` item 12, `skills/formats/reference/architecture.md`, `src/domain/validation/future_rules.ts`

## Situation

On the console-access fixture, the vision's `LATER-shared-sessions` needs a session's output to reach several terminals, and a feature changes how the console session ends, outside the access context's terminal port.

## Expected

The design checks `LATER-shared-sessions` though the feature isn't about sharing, keeps the room in a `Future` fact on the session entity that cites it, and builds nothing for it. A `Future` fact citing nothing draws `future-unanchored`.

## Check

Tests: the Future-fact cases in `test/notes.test.ts`. The design behaviour is a fixture run, by hand.
