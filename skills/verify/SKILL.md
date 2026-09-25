---
name: cruze-verify
description: Verifies a built change before it lands, with the mechanical checks, a fresh-context verifier that runs the real system, a two-lane code review and a manual test script, ending with your decision to accept it or send it back.
---

# Verify

Verify answers one question: does this change work when someone uses it? Green tests are evidence, not proof. A verifier in a fresh context runs the real system through each scenario, reviewers check the code against the spec and the architecture, and the user gets a script to try it themselves. The user decides whether it lands.

## Steps

1. **Check it is ready.** Run `cruze next`. It must name `verify` for this change, on this branch. Find the base commit the change branched from with `git merge-base main HEAD`.
2. **Run the mechanical checks.** Run the project's format, lint, build and test commands from `commands:` in `.cruze/config.yaml`, then `cruze validate`, `cruze check --ci` and `cruze trace --change <ref>`. Quote each result. When one fails, fix the code in a commit and run them again. When a fix needs design, stop and offer `rethink`.
3. **Check the dependencies.** Follow "Checking" in `.agents/skills/cruze-dependency-approval/SKILL.md` against the base commit. An unrecorded dependency is a blocker.
4. **Run the verifier.** Run the verifier role from `.agents/skills/cruze-roles/SKILL.md` for the change. It must be able to build and run the system. When it runs through `cruze review`, check that `review.command` in `.cruze/config.yaml` allows the project's build and run commands, and add them with the user's agreement. Done when you have its report, with a result for every delivered scenario.
5. **Review the code.** Run the review in the roles skill with the code reviewer, `review=code`, `--item <ref>` and the base commit. Fix each finding the user marks `fixed` in a commit, then check the fixes in round 2.
6. **Write the manual test script** as `manual-test.md` in the change folder, following [manual-test.md](manual-test.md). Commit it.
7. **Report.** Show the user four things:
   - The mechanical checks, one line each.
   - The verifier's result for every scenario.
   - The review's outcome, with each finding's disposition.
   - The path to `manual-test.md`, with a recommendation to run it before accepting.
8. **Ask for the decision:** "Do you accept this change, or send it back?"
9. **Record it** with `cruze journal add verification --set result=accepted --set summary="<one line>" --item <ref>`, or `result=sent-back`. On sent-back, say what goes back:
   - A defect in code a task already built: `cruze task reopen T<n> "<reason>"`, then `build`.
   - A design that can't deliver the scenario: `rethink`.

Done when the decision is recorded.

## Rules

- A scenario the verifier couldn't run isn't passed. Mark it clearly in the report and in `manual-test.md`.
- Findings from the review are dispositions in the journal, never edits to `change.md`.
- Fixes made during verify are code commits that stay within the tasks' files. When a fix needs a new file or owner, it is a deviation or a rethink, exactly as in build.

## Next step

- Accepted: `land`.
- Sent back: `build` for reopened tasks, or `rethink` for design.
