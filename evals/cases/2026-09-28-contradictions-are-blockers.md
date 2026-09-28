# Design review lets elements that contradict each other through

- Proposal: tighten design-reviewer rubric item 8 (Consistency) to cover consistency between the artifact's own elements, and make any contradiction a blocker.
- Evidence: mw-config-service-export.json (Cruze 0.0.1): rethinks 2026-09-25-resolution at 2026-09-26T21:57:02.378Z and 2026-09-27T13:54:34.888Z; 2026-09-27-generations at 2026-09-27T20:22:35.101Z and 2026-09-27T22:06:53.944Z. Each was found by the plan review of a later change.
- Asset: skills/roles/design-reviewer.md

## Situation

On the console-access fixture, edit the open-console feature's delta so that one element contradicts another: make `UC-access.open-console`'s Errors name a failure that its `FLOW` raises only after the session is opened, or give an adapter a duty that the XC rule it follows forbids. Run the feature-scope design review with the design-reviewer role in a fresh context.

## Expected

The review reports the contradiction as a blocker under Consistency, quoting both elements. It is not counted among the concerns or the nits.

## Check

Fixture run: headless `architect` review on the edited fixture. Look in the journal for `review` with `blockers` of at least 1 and a `disposition` whose finding starts `Consistency:` and names both element IDs.
