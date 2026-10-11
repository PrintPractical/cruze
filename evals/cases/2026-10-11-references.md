# The project's governing specification had no place in Cruze

- Proposal: `references:` in `.cruze/config.yaml` lists the external documents the design must comply with. `cruze show` lists them, and architect, plan, build and both reviewers read the sections the scope cites.
- Evidence: usp-rs 521c6352 (2026-10-11T04:03): "We should probably make a note for cruze that any architecture and plan session should reference the USP spec in third_party to ensure we are compliant with the spec". Its codec rethink at 13:51 (an unknown header `msg_type`, R-ENC.2 and R-MSG.10) is a rule the specification states.
- Asset: `src/domain/config.ts`, `src/app/use_cases/show_scope.ts`, `skills/formats/reference/config.md`, `skills/architect/SKILL.md`, "Rules"

## Situation

On the console-access fixture, `references:` lists `third_party/rfc4254.txt` for the SSH connection protocol.

## Expected

`cruze show` on a change lists the reference with its use. A reference without a `use` is a config problem in `cruze validate`.

## Check

A test: `test/show.test.ts`, "lists the external documents the design must comply with".
