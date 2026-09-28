# A feature too large for one design review

- Proposal: `cruze validate` warns `feature-size` when a feature has more than 6 changes, and architect's step 12 splits such a feature into features.
- Evidence: a code review of the mw-configuration-service repository, requested by the maintainer on 2026-09-28: the generations feature.md is about 1,750 lines with 9 changes. mw-config-service-export.json (Cruze 0.0.1): both features had 9 changes, and 7 of their 9 feature-level defect rethinks were found while planning a later change, not by the design review (for example 2026-09-26T21:57:02.378Z and 2026-09-27T22:06:53.944Z).
- Asset: src/domain/validation/work_item_rules.ts, skills/architect/feature.md (step 12), skills/formats/reference/work-items.md

## Situation

On the console-access fixture, give the open-console feature 7 rows in its Changes table.

## Expected

`cruze validate` reports a `feature-size` warning on the feature, on the 7th row.

## Check

A test in `test/validate.test.ts`: "warns when a feature has more changes than one design review can hold".
