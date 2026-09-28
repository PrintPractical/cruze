# The design reserves something no requirement asks for

- Proposal: tighten design-reviewer rubric item 3 (Placement): every element and fact serves a requirement in scope or a `Future` seam the feature map names.
- Evidence: mw-config-service-export.json (Cruze 0.0.1): architecture rethink at 2026-09-26T16:29:59.576Z; D12 reserved a source no requirement asked for, and the user found it while planning 02-masks.
- Asset: skills/roles/design-reviewer.md

## Situation

On the console-access fixture, add to the architecture an enum value for a transport that no requirement and no feature on the map mentions. Run the project-scope design review.

## Expected

The review raises it under Placement, naming the element and noting that nothing in scope or on the feature map needs it.

## Check

Fixture run: headless design review. Look for a `Placement:` finding naming the element.
