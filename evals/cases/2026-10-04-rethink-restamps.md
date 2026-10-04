# A feature rethink sends every change under it back to the user

- Proposal: `cruze approve <ref> --restamp-unchanged` re-stamps a feature or change a rethink didn't edit, when only something it cites moved, and the rethink skill tells the user what it re-stamped.
- Evidence: the ReturnToOffice project's journals (Cruze 0.0.4): about 15 of the user's 35 approvals were re-approvals after rethinks. The offices feature was approved 5 times, and changes 01-add-office-by-search and 02-current-location 4 times each, at 2026-10-02T21:13, 22:10 and 2026-10-03T00:02, though their own text hadn't changed.
- Asset: skills/rethink/SKILL.md (step 6), src/domain/approvals/agent_approval.ts

## Situation

On the console-access fixture, approve change 01-local-serial, then amend the open-console feature and re-approve it, as a feature-level rethink does.

## Expected

The change shows `upstream changed`. `--restamp-unchanged` approves it with `basis: rethink`, naming the feature as what changed. It refuses once the change's own text is edited, or a task is reopened.

## Check

Tests in `test/agent_approvals.test.ts`, under "re-stamping what a rethink left unchanged".
