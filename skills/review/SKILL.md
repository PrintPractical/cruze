---
name: cruze-review
description: Reviews a built feature in a fresh context for real defects, a public API that drifted from what the user approved, and scenarios without tests, fixes what it finds, and hands the user only the findings that are theirs.
---

# Review

A reviewer who never saw the build reads the code against the approved feature. It looks for what tests miss: hangs, leaks, races, data loss, failure paths, an API that drifted from what the user approved. One round, then the agent fixes and checks its own fixes. The user hears only about findings that change what they approved.

## Steps

1. **Run the code reviewer** in a fresh context, as `.agents/skills/cruze-roles/SKILL.md` says, on this feature, with the diff from where the feature's branch left `main`: `cruze review code-reviewer --feature <slug> --base <merge-base>`, where the merge base is `git merge-base main HEAD`. Done when you have its report.
2. **Check each finding** against the code before acting on it. Drop one whose evidence doesn't hold, and say why in one line.
3. **Sort them.** A finding is the user's when fixing it would change a scenario, the public API they approved, or a significant dependency. Every other finding is yours, blockers included.
4. **Fix yours.** Fix every blocker, and the concerns worth fixing, each with a test when it is a behaviour. Run the full suite, `cruze check --ci` and `cruze trace <slug>` again. Check your own fixes; don't run the reviewer a second time.
5. **Bring the user theirs,** illustrated as `.agents/skills/cruze-asking/SKILL.md` says: the problem in plain words, who meets it and how, and the change to the feature you recommend, as code or output, before and after. Their answer goes through `shape` as a change to the approved feature, then back to build.
6. **Report and open the pull request.** Tell the user, in a few lines:
   - what the feature now does;
   - how to try it: the commands to run, with what they should see;
   - what the review found and what you fixed, counted;
   - any finding you left, and why, each filed as an issue as `fix` says, so it isn't lost.

   Add a line in the user's words under `[Unreleased]` in `CHANGELOG.md`. Update the README's status, and its usage when the feature changes what a user runs or sees, with the same commands as "how to try it". Push the branch and open a pull request, or merge as the project does. Done when the pull request is open or the branch is merged.

## Next step

`cruze next` names it: usually `shape` for the next feature.
