# Designs leave refusals, port uses, retired rules and quoted output to build

- Proposal: the design reviewer checks each use case against every refusal of every port operation it calls, and each quoted message or value against the code that produces it. Architect modifies a port it gives a new use, lists every port under `Uses`, and rewords every statement of a rule it retires.
- Evidence: Ork at 93cc650, `## Known pitfalls` lines 5, 6, 12 and 19. Line 5 notes that an orchestration-runtime watch needed two rethinks for an unhandled refusal.
- Asset: skills/roles/design-reviewer.md (rubric item 8, item 11), skills/architect/feature.md (step 4), skills/formats/reference/architecture.md (`REMOVED`)

## Situation

On the console-access fixture, design a feature in which `UC-access.open-console` calls a `PORT-inventory.device-catalog` operation that can refuse with a new error, and a scenario quotes the error's printed text.

## Expected

The design review raises a finding when the use case doesn't say what it does with the refusal, or when the quoted text differs from the error's display in the code.

## Check

Fixture run: headless `architect` on the feature with the gap left in. The design review's journal has a disposition naming the refusal or the quoted text.
