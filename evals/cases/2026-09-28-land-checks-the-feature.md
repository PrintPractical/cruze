# Land breaks a citation in the feature without refusing

- Proposal: `cruze land` refuses when the merge introduces an error into the source feature or its changes, not only into `docs/`.
- Evidence: mw-config-service-export.json (Cruze 0.0.1): rethink 2026-09-25-resolution at 2026-09-26T16:54:30.459Z. Landing 02-masks retired a scenario that feature D7 cited, and only a later `cruze validate` caught it.
- Asset: src/app/use_cases/land_change.ts (requireStillValid)

## Situation

On the console-access fixture, give the open-console feature a settled decision citing a scenario, add a REMOVED operation for that scenario to 01-local-serial's delta, verify the change and run `cruze land`.

## Expected

Land throws `merge-invalid` naming the feature's line that cites the removed scenario, and writes nothing.

## Check

A test in `test/land.test.ts`: "refuses a land that would leave the feature citing an ID it removes, and writes nothing".
