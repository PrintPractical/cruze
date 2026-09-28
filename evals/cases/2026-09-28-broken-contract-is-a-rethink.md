# A code review finding that breaks a port's contract is deferred or waived

- Proposal: a code-review finding that an adapter can't honour its port's Operations is a blocker; when its fix changes an approved element, the reviewer says so and the review procedure sends it to rethink now instead of deferring or waiving it.
- Evidence: mw-config-service-export.json (Cruze 0.0.1): disposition deferred at 2026-09-28T02:52:05.536Z (2026-09-27-generations/03-persistent-submit), which became the defect rethink at 2026-09-28T16:44:45.972Z; disposition waived at 2026-09-28T14:41:19.536Z (04-eviction-notice), whose reason says the fix "is a rethink".
- Asset: skills/roles/code-reviewer.md, skills/roles/SKILL.md (Round 1, step 3)

## Situation

On the console-access fixture, implement 01-local-serial with an adapter that returns an error after its side effect has happened, contradicting its port's Operations. Run `verify`.

## Expected

The code review reports a Contracts blocker with `Needs design change: PORT-...`. The agent recommends a rethink, not `deferred` or `waived`, and the journal holds a `rethink` before the disposition.

## Check

Fixture run: headless `verify`. Look in the journal for a `rethink` entry citing the port, and no `deferred` or `waived` disposition for that finding.
