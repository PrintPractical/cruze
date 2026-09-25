---
name: cruze-land
description: Lands a verified change by merging its deltas into the living docs with cruze land, updating the changelog, README and AGENTS.md, and committing or opening a pull request; also lands bug fixes from triage.
---

# Land

Land makes finished work part of the living model. `cruze land` merges the change's spec and architecture deltas into `docs/`, marks what it built, and archives the work when it is finished. This skill takes care of what people read around it: the changelog, the README and the pitfalls in `AGENTS.md`. Then it gets the work onto main.

## Landing a change

1. **Check it is ready.** Run `cruze next`. It must name `land` for this change. When it names `verify`, the change hasn't been accepted yet.
2. **Bring in main.** Merge or rebase the branch onto an up-to-date main, and resolve conflicts.
   - `journal.jsonl` files merge by keeping every line; `cruze init` sets that up in `.gitattributes`. When that file lacks the rule, keep both sides' lines.
   - When an `approvals.json` conflicts, take main's version of it. Then run `cruze status`, and re-approve what it shows stale, as step 3 describes.
   - Resolve code conflicts as usual, then run the tests.
3. **Run `cruze status`.** When the change or its feature shows `upstream changed`, another branch landed changes to elements it cites. Then:
   - Show the user the diff of each changed element, and check that the change's code and tests still hold against it.
   - When they still hold, re-approve the stale documents: the feature first, then the change. The change's verification carries over when its own design didn't change.
   - When they don't hold, stop and offer `rethink`.
4. **Run `cruze land`** and quote its report: what it merged, what is now built, and whether the work finished and was archived.
   - A `merge-conflict` means someone changed an element this feature merged earlier. Stop and run `rethink`, which reconciles it.
   - A `merge-invalid` means the merged docs wouldn't validate. Nothing was written. Stop and run `rethink`.
5. **Update the changelog.** Under `## [Unreleased]` in `CHANGELOG.md`, add one line per user-visible behaviour the change delivers, in the user's words, under `### Added`, `### Changed` or `### Removed`. Name the behaviour, not the code, including any rule a user can now run into that no scenario covers yet.
6. **Update the README** when the change altered how someone installs, runs or uses the product. Run every command you add, to check it works.
7. **Check the pitfalls.** Run `cruze journal list --event disposition`, `cruze journal list --event rethink` and `cruze journal list --event bug`. When findings under the same rubric item with the same root cause, or two defects with the same cause, have now happened twice, add one line under `## Known pitfalls` in `AGENTS.md` saying what to do instead. Keep `AGENTS.md` under one page. When the pitfalls outgrow it, propose to the user a `cruze check` rule or a knowledge-skill change for the oldest ones.
8. **Commit** the land with a message such as `docs: land <change>`. `cruze land` keeps the Commands and Layout sections of `AGENTS.md` current, from `commands:` in `.cruze/config.yaml` and the built modules; when `commands:` is empty, the Commands section stays as it was.
9. **Get it onto main.** Follow the project's convention in `AGENTS.md`. When it has none, ask the user whether they want pull requests or direct merges, and add their answer under `## Conventions`, such as "Changes land through pull requests." Open the pull request, or merge. CI must pass before the merge; when the project has no CI runner, run its steps locally with the project's commands.

Done when the change is on main, or in an open pull request, and `cruze status` no longer lists it as in progress.

## Landing a bug fix

A fix from `triage` has no change folder, so `cruze land` doesn't run.

1. Check that the fix commit has its failing-then-passing test, and that the full test suite, `cruze check` and `cruze trace --all` pass.
2. Add a line under `### Fixed` in `CHANGELOG.md`: what the user saw, and that it is fixed.
3. Check the pitfalls, as in step 7 above.
4. Commit, then open the pull request or merge, as for a change.

## Next step

Once the work is on main, switch to an up-to-date main, run `cruze next` there, and name what it says. Before the merge, `cruze next` on the change's branch can name work that main doesn't hold yet. When a feature just finished and every roadmap item has landed, the next step is `roadmap`, to close the release.
