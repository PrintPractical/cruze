---
name: cruze-explore
description: Thinks an idea through with the user before any design, comparing options and sketching flows, and writes nothing until the user asks to capture it.
---

# Explore

Explore is the optional thinking partner that can come before any other Cruze step. It turns a loose idea into clear options and, when the user wants, a captured note that the next step takes as input. It never writes a design, creates work or records an approval.

## Steps

1. **Frame the problem.** Ask what prompted the idea, who it affects, and what outcome would make it worthwhile. If the user starts from a solution, restate the problem underneath it and confirm it. Done when you can state the problem in one sentence the user agrees with.
2. **Read what exists.** Read whichever of these exist: `docs/vision.md`, `docs/glossary.md`, `docs/architecture.md`, `docs/roadmap.md`, and the code the idea touches. Run `cruze status` to see work in flight. Use the glossary's words from here on, following `.agents/skills/cruze-domain-language/SKILL.md`.
3. **Separate facts from guesses.** List what is known evidence, what is a hypothesis, and what is a preference. Look up any fact you can rather than asking the user for it.
4. **Diverge.** Lay out two to four genuinely different approaches, including leaving things as they are when that is credible. For each, give what it changes, what it leaves alone, its benefits, its costs and failure modes, the assumptions it rests on, and what evidence would tell it apart from the others. Sketch an interaction as a Mermaid `sequenceDiagram` or `flowchart` when that makes a difference clearer.
5. **Converge.** Compare the strongest options against the user's outcome, the vision's goals and constraints, and the architecture. Challenge assumptions and accidental scope growth, following the challenge rules in `.agents/skills/cruze-grilling/SKILL.md`. Recommend one option only when its trade-offs are understood. Otherwise recommend the smallest step that would settle the question, such as a spike, a measurement or a research question.
6. **Offer to capture.** Summarize the problem, the options, the trade-offs, your recommendation and the open questions, then ask whether to capture them. When the user declines, stop here: the discussion itself was the result.

## Capturing

Only when the user says to capture:

1. Run `cruze new note <slug> --title "<title>"` and write the note at the path it returns.
2. Give the note these sections: `## Problem`, `## Options`, `## Recommendation` and `## Open questions`. Mark each statement as fact, hypothesis, preference or recommendation.
3. Done when the note stands on its own for a reader who wasn't in the conversation.

## Handing off

Name the next step, and pass the note's path to it when there is one:

| The idea is | Next step |
| --- | --- |
| A new project, or the project's first vision | `envision`, at project scope |
| A new capability whose requirements aren't settled | `envision "<feature>"` |
| A capability whose requirements are settled | `architect "<feature>"` |
| A small change to existing behaviour | `architect "<tweak>"` |
| A defect in built behaviour | `triage "<symptom>"` |
| A decision already made that now looks wrong | `rethink` |
| Not worth doing now | `cruze features add <slug> --summary <text> --goals <ids>`, with the user's agreement, to keep it on the future list |
