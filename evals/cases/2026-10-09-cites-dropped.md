# A decision cites a scenario the delta drops, and land refuses

- Proposal: `cruze validate` reports `cites-dropped` when work cites a living scenario that a `MODIFIED` requirement in its delta leaves out.
- Evidence: ork bundle (Cruze 0.0.7): rethink at 2026-10-08T11:40:50 on 2026-10-07-configuration-sets/01-sets-in-force ("feature.md D2 and change.md D4 cited SCN-configuration.reject-taken-priority, which the spec delta drops"), found by land with `merge-invalid`.
- Asset: src/domain/validation/work_item_rules.ts, skills/formats/reference/specs.md ("Spec delta")

## Situation

On the console-access fixture, the open-console feature's spec delta modifies REQ-inventory.list-devices, keeping SCN-inventory.list-configured and leaving out SCN-inventory.no-config, while the feature's text still cites SCN-inventory.no-config.

## Expected

`cruze validate` reports `cites-dropped` for the citation while the feature is being designed, so the design names it in words before approval.

## Check

Test: `test/validate.test.ts`, "reports a citation of a scenario that a modified requirement drops as cites-dropped".
