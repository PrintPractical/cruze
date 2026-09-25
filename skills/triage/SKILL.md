---
name: cruze-triage
description: Handles a bug report by reproducing it, finding its root cause against the living docs, and fixing a code defect with a failing test first, or sending a spec gap to architect and a design flaw to rethink.
---

# Triage

Triage starts from a symptom and ends with a fix, or with the right step to fix it. A bug has three possible causes, and each goes somewhere different. When the code doesn't do what the specs say, triage fixes it. When the specs never covered the case, it goes to `architect` as a tweak. When the design can't deliver the specs, it goes to `rethink`.

## Steps

1. **Capture the symptom.** Get the exact steps, what happened (output, error, exit code), what the user expected, and the environment. Done when you can write the steps as commands.
2. **Reproduce it.** Run the steps against the real system. Done when you can make it fail on demand and have quoted the output. When you can't reproduce it, ask the user for what differs in their environment, and stop until you can.
3. **Place it in the living docs.** Find the requirement and scenarios in `docs/specs/` that cover this behaviour, and the flow in `docs/architecture.md` that runs it. Then classify it:
   - **Code defect:** a scenario says what should happen, and the code does something else.
   - **Spec gap:** no scenario covers this case.
   - **Design flaw:** the design as written can't deliver what the scenario says.
4. **Confirm the diagnosis.** Tell the user the classification, the scenario or its absence, and your evidence. They confirm it before anything changes. For a spec gap, stop and hand off to `architect "<tweak>"`. For a design flaw, stop and hand off to `rethink`.
5. **Find the root cause.** Trace the failing path through the code until you can name the line that is wrong and why. The cause is the first wrong decision, not the place the error surfaces.
6. **Write the failing test first.** On a branch such as `fix/<slug>`, add a test at the seam of the violated scenario, following `.agents/skills/cruze-behavioural-testing/SKILL.md`. It carries the scenario's ID and reproduces the bug. Run it, and see it fail for this bug's reason.
7. **Fix it.** Make the smallest change in the module that owns the wrong decision, following `.agents/skills/cruze-hexagonal-design/SKILL.md`. Run `cruze check` on the files you changed, then the full test suite. Done when the new test passes and nothing else broke.
8. **Commit** with a message such as `fix(<scope>): <what the user saw> (SCN-<id>)`.
9. **Record it** with `cruze journal add bug --set summary="<what the user saw>" --set cause="<the root cause>" --set scenario=<SCN id> --set escaped="<the step that should have caught it>"`. `escaped` names the Cruze step that let the bug through, such as `verify`, or `none` when no step could have.

## Rules

- A missing test is part of the cause. When the violated scenario had a test that passed anyway, say why it missed the bug, and strengthen it in the same fix.
- Fix the cause only. Clean-ups you notice nearby go to the user as suggestions.
- Never change a scenario to match the code. That is a spec change, and it goes through `architect`.

## Next step

- Code defect fixed: `land`, which lands bug fixes too.
- Spec gap: `architect "<tweak>"`.
- Design flaw: `rethink`.
