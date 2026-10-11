# Plan branched from an unmerged design branch

- Proposal: architect ends by getting the approved design onto main before plan, which branches from main.
- Evidence: usp-rs plan in 7b125f91 (2026-10-11T04:22) and 3f900739 (14:55) branched from an unmerged `docs/envision-*` branch. The agent warned each time, and land then carried the design documents into the change's pull request.
- Asset: `skills/architect/SKILL.md`, "Next step"

## Situation

On the console-access fixture, architect for a new feature runs on a `docs/` branch and the user approves.

## Expected

Architect tells the user to merge the design to main before `plan`, and plan's branch starts from a main that holds the approved feature.

## Check

Fixture run: headless `architect` then `plan`; check that the plan branch's merge base with main contains the feature's approval.
