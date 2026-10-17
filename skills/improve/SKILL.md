---
name: cruze-improve
description: Improves the structure of existing code to meet Cruze's current standards, by surveying it for structure that departs from them or keeps causing friction, letting you pick any or all of the candidates, designing the target through an architecture rethink, and scheduling the moves as prefactor changes.
---

# Improve

Improve restructures code that already works, so it meets the standards Cruze holds new work to, such as a layout that is normal for the kind of system, or so it stops causing the same friction. It is design work with one approval gate, and it never changes behaviour: the behaviour tests are the safety net, and they pass unchanged at every step.

Realign is different. It applies what each release's notes expect of existing code, and moves `standards:`. Improve runs whenever the user asks, whatever the version, and can take on structure that realign leaves alone, such as a layout the notes mark as new work only.

## Steps

1. **Check what it builds on.** Run `cruze status`. `docs/architecture.md` must be approved and current; when it isn't, stop and name `rethink`. Note the features and changes in flight, which step 8 schedules around. When the user names an area, such as a context or a module, keep to it.
2. **Check the safety net.** Run `cruze trace --all`, and the full suite as `.agents/skills/cruze-formats/reference/config.md` defines it under `commands`. Done when both pass, and you have listed each module whose scenarios have no test. Moving such a module first needs tests that record what it does today.
3. **Load the standards.** Read these, and follow them for the rest of this skill:
   - `.agents/skills/cruze-hexagonal-design/SKILL.md`, `.agents/skills/cruze-hexagonal-design/shapes.md`, and the language file when one exists for the project's language
   - `.agents/skills/cruze-behavioural-testing/SKILL.md`
   - `.agents/skills/cruze-formats/reference/architecture.md`
   - `.agents/skills/cruze-grilling/SKILL.md`
4. **Survey.** Run the surveyor role from `.agents/skills/cruze-roles/SKILL.md` once for the system's layout, then once for each module in the module map, or in the user's area, giving it the module's `Path`. Run them in parallel where the agent can. Check each candidate's evidence against the files and the journal before you use it. Done when the layout and every module in scope have a report.
5. **List the candidates** in one message, numbered, merging candidates that share a cause across modules. For each, give:
   - the problem in one sentence, and its evidence;
   - the standard it departs from, or the friction it causes;
   - the target shape, sketched beside today's as `.agents/skills/cruze-grilling/illustrating.md` says;
   - its size in prefactor changes, and its risk.

   Recommend which to take and why, then ask the user to pick any or all of them.
6. **Record each decision:** `cruze journal add disposition --set review=improve --set finding="<module or area>: <summary>" --set disposition=<fixed|waived|deferred> --set reason="<reason>" --set decided=user`. A picked candidate is `fixed`. The rest are `waived`, with the user's reason, or `deferred`. A recorded waiver is never raised again.
7. **Design the target** for every picked candidate together, as a rethink at architecture level, following `.agents/skills/cruze-rethink/SKILL.md` with `kind=discovery` and `found_by=improve`:
   - Amend `docs/architecture.md`: the module map and layers, the moved elements' `Module` and `File` facts, the `layers:` in `.cruze/config.yaml`, and a `D<n>` or an ADR for each structural decision. Change no requirement, scenario or port contract unless the user decided that in step 5.
   - When a candidate changes an interface, such as a port or a module's public API, sketch two or three shapes as code, compare them, and recommend one before writing it.
   - Before the rethink's walkthrough, run the design review from the roles skill on the diff, with `review=design`.
   - Approve it as the rethink's architecture level says, with `--replan` for each built element that moves.
8. **Schedule the moves.** Group the replanned elements into prefactor changes, as "A prefactor" in `.agents/skills/cruze-architect/tweak.md` describes, each sized as step 12 of `.agents/skills/cruze-architect/feature.md` says.
   - Order them so each lands on its own and the code builds after every one: first the tests that record behaviour a module lacks, then one context or feature at a time.
   - Put each on the roadmap, following `.agents/skills/cruze-roadmap/SKILL.md`. Run `cruze status --overlap --change <ref>`, and block it on every in-flight item it overlaps.
   - Commit, with a message such as `docs: plan the <area> restructure`.

Done when every candidate has a journaled disposition, the target architecture is approved, and every move is a prefactor change on the roadmap.

## Rules

- **Behaviour stays.** Wire formats, stored formats, messages, exit codes, and every approved scenario and its test stay as they are, unless the user decided otherwise in step 5.
- **Small files stay.** Many small modules are the standard, so a candidate never merges files only to make a module deeper. Merging is a candidate when two modules own one responsibility, or one only forwards calls to another.
- **Ports and adapters stay.** A restructure moves where the core, the ports and the adapters live, never whether a technology sits behind a port.
- **The existing layout wins** until the user picks a candidate that changes it. Improve never restructures code the user didn't pick.

## Next step

`plan` for the first prefactor change. When the user picked nothing, `next`.
