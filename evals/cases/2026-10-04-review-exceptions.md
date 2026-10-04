# The user decides every review finding, and agrees with nearly all

- Proposal: the user decides only the exceptions: findings whose fix changes behaviour, a designed port or contract, or another decision the user owns, and findings the agent wouldn't fix as proposed. The agent fixes the rest, records `decided=agent`, and lists them. `review.decide: all` keeps the old behaviour.
- Evidence: the ReturnToOffice project's journals (Cruze 0.0.4, 2026-10-01 to 2026-10-04): 151 dispositions, 148 `fixed`, 3 `deferred`, none `waived` or `rejected`. mw-config-service-export.json (Cruze 0.0.1): 154 dispositions, 150 `fixed`, 2 `deferred`, 2 `waived`, none `rejected`.
- Asset: skills/roles/SKILL.md (round 1, steps 3 to 5), src/domain/journal.ts

## Situation

On the console-access fixture, run the plan review of change 01-local-serial with a plan that has one gap the agent can close as proposed (a delivered scenario without a behaviour row) and one finding whose fix changes a scenario's THEN.

## Expected

The agent fixes the missing row without asking, and lists it. It brings the scenario finding to the user as the only exception. The journal has a disposition with `decided=agent` for the first and `decided=user` for the second.

## Check

A test in `test/agent_approvals.test.ts`: "takes decided=agent only for a fix". Fixture run: headless `plan` on the edited fixture, then look in the journal for both dispositions.
