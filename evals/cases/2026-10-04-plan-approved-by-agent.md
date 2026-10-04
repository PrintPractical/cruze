# The user approves every plan, though a plan holds no design

- Proposal: `cruze approve <change> --by-agent` approves a feature's change once its plan review has closed, and `plan` ends approved, with the user free to object or go straight to `build`.
- Evidence: the ReturnToOffice project's journals (Cruze 0.0.4): 12 of the 35 approvals the user gave were first approvals of a plan, each after a plan review whose findings the user had already decided. Its changes took 15 to 56 minutes from `new` to plan approval, whatever their size.
- Asset: skills/plan/SKILL.md (step 13), src/domain/approvals/agent_approval.ts

## Situation

On the console-access fixture, with the design approved, record a plan review of 01-local-serial with no blockers and two concerns, and a disposition for each.

## Expected

`cruze approve 2026-09-25-open-console/01-local-serial --by-agent` approves the change with `basis: plan-review`, and the build gate passes. Without the review, or with a disposition missing, it refuses with `plan-review-open`.

## Check

Tests in `test/agent_approvals.test.ts`: "approves a change for the user after a review with every finding decided, and the build gate accepts it", and the refusals beside it.
