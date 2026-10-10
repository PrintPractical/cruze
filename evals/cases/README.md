# Eval cases

Each file here pins a change to Cruze to the evidence that prompted it: journal entries from a project's `cruze feedback export`, found by the `cruze-retro` maintainer skill. The format is in `.agents/skills/cruze-retro/eval-cases.md`.

The first cases, dated 2026-09-28, come from the retro on the mw-configuration-service project's feedback bundle and a review of its code. Cases whose check is a test name it; the others are fixture runs.

A fixture run with a `## Run` section (the prompt, optional setup commands and the agent's tools) is executable: `node evals/run.ts evals/cases/<file>` runs it headlessly on a copy of the fixture and grades the result, as `../README.md` describes. A case without `## Run` is reported as manual, and is run by hand.
