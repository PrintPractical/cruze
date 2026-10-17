---
name: cruze-verify
description: Verifies a built change before it lands, with the mechanical checks, a fresh-context verifier that runs the real system, a two-lane code review and a manual test script, ending with your decision to accept it or send it back.
---

# Verify

Verify answers one question: does this change work when someone uses it? Green tests are evidence, not proof. A verifier in a fresh context runs the real system through each scenario, reviewers check the code against the spec and the architecture, and the user gets a script to try it themselves. The user decides whether it lands.

## Steps

1. **Check it is ready.** Run `cruze next`. It must name `verify` for this change, on this branch. Find the base commit the change branched from with `git merge-base main HEAD`. The code review's base is the same, unless `cruze journal list --event verification --item <ref>` shows an earlier verify: then it is that entry's commit, or `git rev-list -1 --before=<its at> HEAD` for one without, since the code before it was reviewed.
2. **Run the mechanical checks.** Run `cruze validate`, `cruze check --ci` and `cruze trace --change <ref>`, and quote each result.
   - Run `cruze journal list --event checks --item <ref>`. When its last entry's commit has no code changes since, that is when `git diff --quiet <commit> HEAD -- . ':(exclude)docs' ':(exclude).cruze'` succeeds, quote that entry for the format, lint, build and test commands instead of running them again.
   - Otherwise run the format, lint and build commands and the full suite, as `.agents/skills/cruze-formats/reference/config.md` defines it under `commands`. When they pass, record them with `cruze journal add checks --set commit=<commit> --item <ref>`, where the commit is the output of `git rev-parse --short HEAD`.
   - When one fails, fix the code in a commit and run them again. When a fix needs design, stop and offer `rethink`.
3. **Check the dependencies.** Follow "Checking" in `.agents/skills/cruze-dependency-approval/SKILL.md` against the merge base. A significant dependency without the user's approval is a blocker.
4. **Run the verifier.** Run the verifier role from `.agents/skills/cruze-roles/SKILL.md` for the change, with the mechanical checks' results and the commit they ran at. It must be able to build and run the system. When it runs through `cruze review`, check that `review.command` in `.cruze/config.yaml` allows the project's build and run commands, and add them with the user's agreement. Done when you have its report, with a result for every delivered scenario.
5. **Review the code.** Run the review in the roles skill with the code reviewer, `review=code`, `--item <ref>` and the code review's base. Fix each finding whose disposition is `fixed` in a commit, through a detail amendment when it needs one, running the tests each fix touches, and `test` when `commands:` has a `test_full`. Then check the fixes yourself, as round 2 in the roles skill says.
6. **Write the manual test script** as `manual-test.md` in the change folder, following [manual-test.md](manual-test.md). Commit it.
7. **Check the fixes once.** When code changed since the last `checks` entry, run the format, lint and build commands and the full suite once more, and record them as in step 2. Done when the last `checks` entry is at a commit with no code changes since.
8. **Report.** Show the user four things:
   - The mechanical checks, one line each, and each new package with its record.
   - The verifier's result for every scenario.
   - The review's outcome, with each finding's disposition.
   - The path to `manual-test.md`, with a recommendation to run it before accepting.
9. **Ask for the decision:** "Do you accept this change, or send it back?"
10. **Record it** with `cruze journal add verification --set result=<accepted|sent-back> --set summary="<one line>" --set commit=<commit> --item <ref>`, where the commit is the output of `git rev-parse --short HEAD`, adding `--set back_to=<build|rethink>` when it is sent back. On sent-back, say what goes back:
   - A defect in code a task already built: `back_to=build`, then `cruze task reopen T<n> "<reason>"`.
   - A design that can't deliver the scenario: `back_to=rethink`. Leave the tasks to the rethink, which reopens the ones its amendment changes, and `cruze next` names `rethink` until it is recorded.

Done when the decision is recorded.

## Rules

- A scenario the verifier couldn't run isn't passed. Mark it clearly in the report and in `manual-test.md`.
- Findings from the review are dispositions in the journal. They edit `change.md` only through a detail amendment.
- Fixes made during verify are code commits that stay within the tasks' files. When a fix needs a new file or owner, or a detail, handle it exactly as build does.

## Next step

- Accepted: `land`.
- Sent back: `build` for reopened tasks, or `rethink` for design.
