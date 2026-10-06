# Existing code keeps a structure the standards now advise against

- Proposal: an `improve` workflow skill with a `surveyor` role: survey the layout and each module against the standards, the journal and git co-change, list candidates with evidence, let the user pick any or all, design the target as an architecture rethink with a design review, and schedule prefactor changes that keep behaviour.
- Evidence: rto (Cruze 0.0.6): 13 package targets and 1,102 `public` declarations from a target per layer per context; its realign note for the new layout applies to new work only, so realign never restructures it. The maintainer asked for a skill "to refactor a project to meet our current standards".
- Asset: skills/improve/SKILL.md, skills/roles/surveyor.md

## Situation

On the console-access fixture, move `ENT-access.escape-detector` into the inventory module's folder, so it sits in the wrong context, and add two deviations to the journal that name the misplaced file. Run `improve`.

## Expected

The surveyor reports the misplaced entity as a candidate with the deviations as evidence. The agent lists it, the user picks it, and the result is an approved architecture rethink with the element replanned and a prefactor change on the roadmap. No requirement, scenario or behaviour test changes.

## Check

Fixture run: headless `improve`, picking every candidate. `cruze journal list --event disposition` shows `review=improve` for each candidate, `cruze status` shows the architecture approved, and the roadmap lists the prefactor.
