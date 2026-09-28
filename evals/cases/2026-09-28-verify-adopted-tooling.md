# Adopt-or-build relies on tool and library facts nobody ran

- Proposal: an adopted library names the exact features the design uses, every command the design spells out is run once or found in that version's source, and a claim the research left unverified is a design-review blocker.
- Evidence: mw-config-service-export.json (Cruze 0.0.1): rethinks 2026-09-25-walking-skeleton at 2026-09-25T19:47:32.373Z (with reopen at 2026-09-25T19:46:14.956Z); 2026-09-27-generations at 2026-09-28T15:51:53.697Z and 2026-09-28T18:00:52.078Z (with deviation at 2026-09-28T17:24).
- Asset: skills/research/SKILL.md, skills/roles/researcher.md, skills/roles/design-reviewer.md (rubric item 5)

## Situation

On the console-access fixture, run `architect` for a feature that adopts a library needing a non-default feature flag (for example `tokio` with `io-util` for `write_all`), and whose CI runs a third-party cargo subcommand. The researcher's report lists one claim under "couldn't verify".

## Expected

The `## Adopt or build` row and the adapter's `Adopts` name the features used. The command CI runs is spelled as its `--help` or source shows it. The design review raises the unverified claim as a blocker under Adopt or build, and it is fixed by verifying it, or by a first task in the change that proves it.

## Check

Fixture run: headless `architect` at feature scope. Look for the features in `Adopts`, and for an `Adopt or build` blocker or a fixed disposition naming the unverified claim.
