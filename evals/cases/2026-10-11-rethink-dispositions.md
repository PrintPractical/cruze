# Design findings left for a later rethink were invisible

- Proposal: a finding can be decided `rethink` with `--item`; `cruze next`, `cruze status` and the build gate show it until a rethink is recorded for that item. Realign records a design reviewer's finding on a feature in flight this way.
- Evidence: Ork's 0.0.9 realign recorded seven flow-control findings on network-orchestrator as `fixed`, with reasons such as "settled by a rethink before 03 is planned". Neither `cruze status` nor `cruze next` showed them; the agent found them in the realign commit message.
- Asset: `src/domain/status/pending_rethink.ts`, `src/domain/journal.ts`, `skills/realign/SKILL.md`, step 5, `skills/roles/SKILL.md`, "Round 1"

## Situation

On the console-access fixture, with the design approved and `01-local-serial` approved on its branch, a realign finding on the feature is recorded with `disposition=rethink`.

## Expected

`cruze next` names `rethink` for the feature with the finding, status lists it, and the build gate fails, until a rethink is recorded with `--item` for the feature.

## Check

A test: `test/realign.test.ts`, "holds a feature's work until the design findings decided for a rethink have one, and names them".
