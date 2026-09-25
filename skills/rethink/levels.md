# Amending each level

## Change

1. Edit the change's `## Test plan` or `## Tasks` so they are right. The scope doesn't change at this level; a scope change is a feature-level rethink.
2. Run `cruze validate`. Done when it reports no errors for the change.
3. Run the plan review from `.agents/skills/cruze-roles/SKILL.md` on the diff alone, with the design reviewer's plan rubric and `review=plan`.
4. Re-approve with `cruze approve <change>`.

## Feature

1. Edit the feature's `## Spec delta`, `## Architecture delta` or `## Changes`. For a standalone change, edit its own deltas and scope. Write complete bodies, as `architect` does, and keep the scope rules.
2. Run `cruze validate`. Done when it reports no errors for the feature or its changes.
3. Run the design review from the roles skill on the diff alone, with `review=design`. Walk the user through the changed parts, following `.agents/skills/cruze-architect/walkthrough.md`.
4. Re-approve the feature. For each of its changes that shows as stale, update the change's scope, test plan and tasks to match. Reopen touched tasks, and re-approve the change.
5. When a change hasn't been created yet, only the feature's Changes row changes; `plan` picks it up.

## Architecture

1. Edit `docs/architecture.md` directly. Keep every element's ID, and write complete bodies. Write an ADR with `cruze new adr` when the decision passes the ADR test, and link it under `## Decisions`.
2. Run `cruze validate`, then run the walkthrough of the diff only, following `.agents/skills/cruze-architect/walkthrough.md`.
3. List the elements you changed that are already `built`, whose code must now change. When the user approves, run `cruze approve architecture`, adding `--replan <ID>` for each of them. They go back to `planned` until a change rebuilds them.
4. Commit the amendment, and get it onto main on its own, as a pull request or a merge. Every branch and every later change must build on it. Then merge main into the branch you were working on.
5. Hand each replanned element to a change that rebuilds it:
   - **The current change**, when the rebuild belongs to its work. Add the element to the feature's Changes row for that change and to the change's `Builds`, then re-plan and re-approve the change.
   - **A prefactor**, otherwise. From an up-to-date main, run `architect "<prefactor>"`, which designs it as a standalone change, then `plan`, `build`, `verify` and `land` it before the current change continues.
6. Run `cruze status`. Every document citing a changed element shows `upstream changed`:
   - When the document's own delta changes that element, rewrite the delta so it keeps your amendment. `cruze approve` refuses it with `rebase-required` until you do. Then approve it with `--rebase <ID>`.
   - Otherwise, show the user the element's diff, and re-approve the document as the skill's step 6 describes.

## Vision

1. Edit `docs/vision.md` with the user: goals, non-goals or constraints. The feature map changes only through `cruze features add` and `cruze features drop`.
2. Update `docs/roadmap.md` to match, following `.agents/skills/cruze-roadmap/SKILL.md`.
3. For each feature in progress that served a dropped goal, the user decides: keep it, or stop it with `cruze abandon <ref> --reason "<why>"`. Abandoning archives the folder and puts the feature back on the future list; changes that already landed stay.
4. Re-approve with `cruze approve vision`, then `cruze approve roadmap`.

## A conflict with living text

`cruze approve` refuses a feature or standalone change with `rebase-required` when an element its delta changes was edited in the living docs since its last approval, by a rethink or another branch's land. `cruze land` refuses with `merge-conflict` for the same reason when the approval came first. Either way, the delta would overwrite that edit. Record the rethink at feature level.

1. Show the user the element's current text in `docs/architecture.md` or `docs/specs/`, and the feature's delta for it.
2. Rewrite the delta's body so that it holds both: their edit, and what this feature needs.
3. Re-approve the feature with `cruze approve <feature> --rebase <ID>`. This records that the feature now builds on the current text.
4. Re-approve the change that is landing, when it shows stale; its verification carries over. Then run `land` again.
