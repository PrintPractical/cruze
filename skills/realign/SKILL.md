---
name: cruze-realign
description: Brings an existing codebase up to what the installed Cruze expects, by auditing it against each release's realign notes, deciding every finding with you, and scheduling the fixes as prefactor changes.
---

# Realign

Each Cruze release can expect more of a project's code and documents than the last, such as where tests live or how error types are shaped. `cruze install` updates the skills; realign brings the existing work up to them. The code's version is `standards:` in `.cruze/config.yaml`, and the installed one is `cruze:`. Rules newer than `standards:` report but fail no CI until realign moves it.

## Steps

1. **Find the gap.** Run `cruze realign status` and quote its first line: the version the code meets and the one installed. Add `--full` when the user asks for a full audit, or the project adopted Cruze partway and has never been realigned; it takes every release's notes. On `install-first`, the skills are older than the CLI: run `cruze install` first. Read [notes.md](notes.md) for what a note holds. Done when you can name every note in the report.
2. **See what is in flight.** Run `cruze status`. Realign doesn't wait for active features and changes; it schedules around them in step 6.
3. **Load the standards.** Read these, and each skill file a note's `Rule` names:
   - `.agents/skills/cruze-hexagonal-design/SKILL.md`, and its language file when one exists for the project's language
   - `.agents/skills/cruze-behavioural-testing/SKILL.md`
   - `.agents/skills/cruze-formats/reference/architecture.md`
4. **Audit.** Run the auditor role from `.agents/skills/cruze-roles/SKILL.md` on every note with an `Ask`. In a full audit, give it the standards instead, and run one auditor per module in the module map. Check its evidence against the files. Done when every note with an `Ask` has an answer with evidence, and every note with a `Detect` has its findings from the status report.
5. **Decide each finding** with the user, a group at a time, with your recommendation:
   - `fixed`: a prefactor change will fix it.
   - `waived`: the project keeps its own convention, with the reason. For a `check:` finding, list the file under `check.exceptions` with that reason, which keeps CI green. For the rest, the journal holds the waiver.
   - `deferred`: it waits for later work, recorded with `cruze features add` or on the roadmap.

   Record each with `cruze journal add disposition --set review=realign --set finding="<note id>: <path or summary>" --set disposition=<fixed|waived|deferred> --set reason="<reason>"`. For a finding from a `Detect` rule, write the finding as exactly `<note id>: <path>`, so `cruze realign status` knows it next time. A recorded waiver is never raised again.
6. **Schedule the fixes.** Group the `fixed` findings into prefactor changes, each small enough to plan (about 12 tasks), one module or concern per change.
   - When a fix changes what `docs/architecture.md` says, such as an error element, a use case's `Errors` or a port's `Operations`, run `rethink` at architecture level first. It replans the built elements the prefactor rebuilds.
   - Create each prefactor as "A prefactor" in `.agents/skills/cruze-architect/tweak.md` describes. The behaviour tests are its safety net: wire formats, messages and exit codes stay as they are unless the user decides otherwise.
   - Put each on the roadmap, following `.agents/skills/cruze-roadmap/SKILL.md`. Run `cruze status --overlap --change <ref>`, and block it on every in-flight item it overlaps.
7. **Record it.** Run `cruze realign done`, adding `--change <ref>` for the prefactor that fixes the `Detect` findings still open. It moves `standards:` up, and lists those files under `check.exceptions` until that change lands, when `cruze land` removes them. Quote its result, and commit with a message such as `chore: realign to Cruze <version>`.

Done when `cruze realign status` reports the code meeting the installed version, and every finding has a journaled disposition.

## Next step

`plan` for the first prefactor change. When nothing needed fixing, `next`.
