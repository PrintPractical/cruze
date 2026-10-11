# Lessons about Cruze pile up in the project's AGENTS.md

- Proposal: land sorts each repeated cause; a lesson about the product goes under `## Known pitfalls`, and one about Cruze's steps or general practice is journaled as a `lesson`. `cruze feedback export` carries both lessons and pitfalls.
- Evidence: Ork at 93cc650 (Cruze 0.0.9): 20 lines under `## Known pitfalls`, of which 12 are about plans, deltas and task lists, such as "A task lists every file it changes" and "In a plan, run `wc -l` on every existing file a task extends". None reached a feedback bundle, and none were in Cruze's skills.
- Asset: skills/land/SKILL.md (step 7), src/app/use_cases/journal_events.ts, src/domain/journal.ts

## Situation

On the console-access fixture, the journal holds two plan-review dispositions under rubric item 2 with the same cause, a task that missed the file declaring a new module, and the change is landing.

## Expected

Land records `cruze journal add lesson --set step=plan ...` and leaves `## Known pitfalls` in `AGENTS.md` unchanged. `cruze feedback export` includes the lesson entry and the `pitfalls` lines.

## Check

Test: `test/journal.test.ts`, "exports the project's known pitfalls, redacted, and records a lesson about a Cruze step". Fixture run for the land step: the journal gains a `lesson` entry and `AGENTS.md` does not change.
