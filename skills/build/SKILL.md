---
name: cruze-build
description: Builds an approved feature, or the changes to one built before, test-first, one scenario at a time, with ports and adapters as the architecture maps them, checks its own code for failure modes, and stops for the user only when a scenario or the public API has to change.
---

# Build

Build turns an approved feature into working, tested code without asking the user anything, unless what they approved has to change. Each scenario starts as a failing behaviour test and ends as a green, checked commit.

## Steps

1. **Check the approval.** Run `cruze status`. The feature must be `approved`; when it is `unapproved` or `edited`, stop and run `shape` first.
2. **Load the standards** and follow them throughout:
   - `.agents/skills/cruze-behavioural-testing/SKILL.md`
   - `.agents/skills/cruze-hexagonal-design/SKILL.md`, and its language file when one exists for the project's language
   - `.agents/skills/cruze-dependency-approval/SKILL.md`
3. **Read the design:** the feature file, and the sections of `docs/architecture.md` its stack sketch touches. For a feature built before, build only what its file changed since the commit that marked it built. Done when you can name, for each scenario you build, the use case it runs and the ports it crosses.
4. **Build the foundation first,** when this is the release's first feature. See "The foundation" below.
5. **Build each scenario in order,** with the loop below. A changed scenario's test takes its new values; a removed one's goes.
6. **Check your own failure modes.** Read your diff for what tests rarely reach. For each task, loop, wait, lock, retry and queue you added: what happens when it is cancelled midway, when two failures fall due at once, when a notice arrives during a pass, and when the other side never answers. For each fake: does it do what the real adapter does on every platform the project runs on, including the states in between, such as an address not yet usable? Fix what you find, with a test. Done when you have asked each question of each one.
7. **Finish.** Run every check the project's CI runs, and at least the formatter, the linter, the build and the full test suite, then `cruze check --ci` and `cruze trace <slug>`, and fix what they report. Show the user each scenario you corrected, as before and after, and run `cruze approve <slug>` on their word. Set the feature's status line to `- Status: built`, and commit. Done when every check passes and the user has approved.

## The loop

For each scenario:

1. **Red.** Write the behaviour test at the seam the testing skill names, carrying the scenario's ID in a comment or string, with the scenario's values as its expected values. Run it, and see it fail for the reason you expect.
2. **Green.** Write the code that makes it pass, inside out: domain types, then the use case, then the port, then the adapter, then the wiring in the composition root. Each port the stack sketch names gets a fake that honours its contract, and a contract test that both the fake and the real adapter pass.
3. **Check.** Run `cruze check --ci` on the files you touched, the formatter and the linter, and the tests near what you changed.
4. **Commit** with a Conventional Commit message, such as `feat(export): write rows as CSV (SCN-export-csv.basic)`.

Done for a scenario when its test passes, the checks pass and the commit exists.

## Deciding as you go

Decide everything local yourself: private helpers, file splits, internal types, test fixtures, an ordinary library. Note any choice a reviewer or the user might question in the feature's `## Decisions`, one line with the reason. Ask nothing about these.

When a scenario is wrong about a fact you can show, such as how a platform behaves, a command that doesn't exist or a number that doesn't add up, and the corrected wording keeps what it was for, correct it and carry on. Never correct one to match code you wrote. Finish shows the corrections for one approval.

Stop and run `shape` when the code needs any of these:

- a change to what a scenario is for or covers, or a new scenario;
- a change to the public API the user approved;
- a significant dependency the architecture doesn't name;
- a port or a runtime change the architecture doesn't allow;
- a shared piece that doesn't exist and that other features would use, which shape splits into a feature of its own, built first.

Show the user what changed, as code or output, before and after, and get the approval again. Then carry on; finished scenarios keep their commits.

## The foundation

The first feature of a release also sets up what every later feature relies on:

- the project's build, with the layers of `docs/architecture.md` as directories and `source`, `tests` and `layers` in `.cruze/config.yaml` matching them;
- CI in `.github/workflows/ci.yml` that runs the formatter, the linter, the build, the full test suite, and a line coverage gate, such as `cargo llvm-cov --fail-under-lines 80`, alongside the Cruze checks already there;
- `## Commands` and `## Layout` in `AGENTS.md`, filled in from what exists;
- the project's test and lint commands added to what `review.command` in `.cruze/config.yaml` allows, as `.agents/skills/cruze-formats/config.md` shows, so the reviewer can run them.

## Protecting the check

Never weaken, skip or delete a test to get green. A failing test means the code is wrong, or the scenario is, and a wrong scenario goes through `shape`. Change a test to match only when its scenario changed, approved by the user or corrected as "Deciding as you go" says.

## Next step

`review`, once the finishing checks pass.
