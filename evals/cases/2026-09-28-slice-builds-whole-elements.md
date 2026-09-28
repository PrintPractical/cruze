# The Changes table builds half an element, or misses a dependency

- Proposal: tighten design-reviewer rubric item 9 (Slicing): a change builds an element only when its delivered scenarios prove the whole body; otherwise the element is split or its later duties move to `Future`; `Depends on` names every change that builds something its scenarios need.
- Evidence: mw-config-service-export.json (Cruze 0.0.1): rethinks 2026-09-25-walking-skeleton at 2026-09-25T18:47:44.113Z; 2026-09-25-resolution at 2026-09-26T16:29:59.494Z and 2026-09-26T19:33:54.718Z.
- Asset: skills/roles/design-reviewer.md, skills/architect/feature.md (step 10)

## Situation

On the console-access fixture, add to the open-console feature an XC element with two duties, one delivered by 01-local-serial and one by a later change, and list it in 01's Builds only. Leave out a `Depends on` that a later change needs. Run the feature-scope design review.

## Expected

The review reports both under Slicing: the XC built by a change whose scenarios prove only part of it, and the missing dependency.

## Check

Fixture run: headless design review. Look for two findings starting `Slicing:` naming the XC ID and the missing dependency.
