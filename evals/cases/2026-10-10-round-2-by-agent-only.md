# Fresh-reviewer round 2 found nothing, again

- Proposal: round 2 is always checked by the agent; a fresh reviewer never re-reads the fixes.
- Evidence: rto bundle (Cruze 0.0.4 to 0.0.7): 25 round-2 reviews, all `blockers=0`, 3 of them `checked_by=reviewer` after 0.0.6. Ork bundle (0.0.7): 24 round-2 reviews, all `blockers=0`, 8 `checked_by=reviewer` (6 design at 2026-10-07 to 2026-10-10, 2 code). Each fresh round 2 took about 10 minutes and 6M input tokens.
- Asset: `skills/roles/SKILL.md` ("Round 2"), `skills/roles/design-reviewer.md`, `skills/roles/code-reviewer.md`

## Situation

On the console-access fixture, a design review of the open-console feature reports one blocker, and the agent fixes it with an edit that goes slightly past the proposal.

## Expected

The agent checks the fix itself against the diff, runs `cruze validate`, records `round=2` with `checked_by=agent`, and says in the message that presents the fix that it went past the proposal. No second reviewer runs.

## Check

Fixture run: headless `architect` on a feature seeded with one contradiction; `cruze journal list --event review --item <ref>` shows one `round=2` entry with `checked_by=agent`, and the transcript starts one reviewer subagent.
