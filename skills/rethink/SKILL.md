---
name: cruze-rethink
description: Steps back from any point, before or after landing, when something decided upstream turns out wrong or new information arrives. It amends only the level the discovery touches, keeps completed work, re-approves what went stale, and records the rethink for improving Cruze.
---

# Rethink

Finding a design flaw mid-build is information, not failure. Rethink amends the highest document the discovery touches and lets computed status show what went stale downstream. Then it re-approves exactly that, keeping every completed task the amendment doesn't touch. There is no state to reset: approvals follow content, so editing a document is how you step back.

## Steps

1. **State the discovery.** Say what is wrong or new, and quote the evidence: the failing test, the output, the document line, or what the user said.
2. **Classify it.** Pick the level from the table below, using the highest level the discovery touches. Pick its kind:
   - **Defect:** a Cruze step should have caught it.
   - **Discovery:** it is new information no step could have had.

   Tell the user the level and the kind in one line, and let them correct it.
3. **Load the standards.** Read `.agents/skills/cruze-grilling/SKILL.md`. At feature or architecture level, also read `.agents/skills/cruze-hexagonal-design/SKILL.md`. Also read the format reference for the document you will amend: `.agents/skills/cruze-formats/reference/architecture.md`, `specs.md`, `work-items.md` or `durable-docs.md`.
4. **Amend that level,** following the level's section in [levels.md](levels.md). Settle any decision the amendment needs with the user, and record it as that level records decisions.
5. **Keep completed work.** A ticked task stays ticked unless the amendment changes its owner, its files, or what it proves. Reopen each task that changed with `cruze task reopen T<n> "<what changed>"`. Its commits stay in history, and build redoes the task.
6. **Re-approve what went stale.** Run `cruze status` and work from the top down: the amended document first, then each document it lists as `upstream changed`. For each one, show the user the diff of the elements it names, and re-approve it with `cruze approve <ref>` once they agree. A change's verification carries over when its own design didn't change.
7. **Record the rethink.** Draft the entry and show it to the user in one line. When they confirm, run:

   ```sh
   cruze journal add rethink --set level=<task|change|feature|architecture|vision> --set kind=<defect|discovery> \
     --set summary="<what changed>" --set wrong="<document and element, and what was wrong>" \
     --set caught_by="<for a defect, the step that should have caught it; for a discovery, the step that found it>" \
     --set agent="<the agent you run in>" [--item <ref>]
   ```

Done when `cruze status` shows every document approved and current, or names only work the user chose to leave for later.

## Levels

| Level | Example | Amend | Then |
| --- | --- | --- | --- |
| Task | A helper belongs in a different file of the same module | Nothing. Record it with `cruze task deviation` | Carry on building. This is not a rethink, so record no rethink entry |
| Change | A test plan row or a task's file is wrong, with no design change | `change.md`: its test plan or tasks | Plan review of the diff, then re-approve the change |
| Feature | A use case needs a second port operation; a scenario is wrong | `feature.md`: its deltas and Changes table, or a standalone `change.md`'s deltas | Design review of the diff, walkthrough of the changed parts, then re-approve the feature and its changes |
| Architecture | An entity boundary is wrong, or a new port is needed | `docs/architecture.md` directly, plus an ADR when it passes the ADR test | Walkthrough of the diff only, then `cruze approve architecture`, with `--replan` for built elements whose code must change |
| Vision | The release's scope was wrong, or a new goal appears | `docs/vision.md`, and `docs/roadmap.md` | Re-approve the vision and the roadmap. Decide what happens to features that served a dropped goal |

## After landing

Landed work is history, so rethink never edits an archived folder.

- A discovery about behaviour that already shipped becomes a tweak or a feature through `architect`.
- A discovery about the design becomes an architecture-level rethink, whose `--replan` hands the rebuild to a change.
- A `merge-conflict` from `cruze land`, or a `rebase-required` from `cruze approve`, is a feature-level rethink, reconciled as described in [levels.md](levels.md).

## Next step

Run `cruze next`, and name what it says.
