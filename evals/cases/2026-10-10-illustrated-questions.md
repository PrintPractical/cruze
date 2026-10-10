# Questions are hard to picture from words alone

- Proposal: every grilling question, review exception and walkthrough shows what each option looks like (a plain-text diagram, a code sketch in the project's language, or the exact interaction), opens with where things stand, and spells out the IDs it uses.
- Evidence: maintainer report, 2026-10-10: during envision, architect and design reviews on the RTO and Ork projects, the user kept asking the agent for diagrams and code snippets before they could answer, and lost context switching between projects.
- Asset: skills/grilling/illustrating.md, skills/grilling/SKILL.md (A round), skills/roles/SKILL.md (Round 1, step 4), skills/architect/walkthrough.md (The overview)

## Situation

On the console-access fixture, run `architect` at feature scope for a feature that adds a port operation with two reasonable shapes, and a design review that returns at least one exception.

## Expected

- Each round opens with a `Where we are:` line and keeps to 3 to 5 questions.
- The question about the port operation shows both options as code sketches in the fixture's language, using the design's names, with bodies left out.
- Each exception shows the failure and the fix before and after.
- The walkthrough overview has a plain-text diagram of the main scenario and a code sketch of the new elements.
- The shape the user picks appears in the port's `Operations` in `feature.md`.

## Check

Fixture run: headless `architect` with scripted answers. Read the transcript's rounds, the exception message and the walkthrough, then the architecture delta.
