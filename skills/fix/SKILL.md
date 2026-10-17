---
name: cruze-fix
description: Takes a reported bug from symptom to a merged fix, reproducing it with a failing test first, fixing the root cause, and reviewing the fix, going back to the user only when the fix changes approved behaviour.
---

# Fix

A bug report becomes a failing test, then a fix, then a reviewed pull request. Most bugs are code that doesn't do what its feature's scenario says, and those need nothing from the user. Only when the fix would change what a scenario or the public API says does the user decide.

## Steps

1. **Capture the symptom:** the exact steps, what happened (output, error, exit code), what the user expected, and the environment. Done when you can write the steps as commands.
2. **Reproduce it** against the real system. Done when you can make it fail on demand and have quoted the output. When you can't, ask the user what differs in their environment, and stop until you can.
3. **Find the scenario** in `docs/features/` that covers this behaviour, and classify the bug:
   - **The code is wrong:** a scenario says what should happen, and the code does something else.
   - **A scenario is missing:** no scenario covers this case, and the right behaviour is obvious from the feature, such as a crash where the feature already says what failure looks like.
   - **The behaviour is the user's call:** the right behaviour isn't obvious, or the fix changes what a scenario or the public API says.
4. **Find the root cause.** Trace the failing path until you can name the first wrong decision, not the place the error surfaces.
5. **Write the failing test first** on a branch such as `fix/<slug>`, at the seam `.agents/skills/cruze-behavioural-testing/SKILL.md` names, carrying the scenario's ID. For a missing scenario, add it to the feature file first, in the same style as its neighbours. Run the test, and see it fail for this bug's reason.
6. **Fix it** with the smallest change in the code that owns the wrong decision. Run `cruze check --ci`, `cruze trace` and the full suite.
7. **Ask the user only when it is their call.** Show the bug, the behaviour you recommend, and the change to the feature as before and after, as `.agents/skills/cruze-asking/SKILL.md` says. Edit the feature, and run `cruze approve <slug>` once they agree. Do this on the same branch.
8. **Review the fix:** run the code reviewer on the fix's diff, as `review` says, and fix what it finds.
9. **Land it.** Commit with a message such as `fix(<scope>): <what the user saw>`, add a line under `### Fixed` in `CHANGELOG.md`, and open a pull request or merge as the project does.

## Rules

- A missing test is part of the cause. When the scenario had a test that passed anyway, say why it missed the bug, and strengthen it in the same fix.
- Fix the cause only. Clean-ups you notice go to the user as suggestions.
- Never change a scenario to match the code without the user's approval.

## Next step

`cruze next`, or the next bug.
