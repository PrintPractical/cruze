---
name: cruze-architect
description: Decides how to build and how big, at project scope (domain model, contexts, ports, adapters, module map, layer rules, ADRs and the roadmap with its walking skeleton), feature scope (the architecture delta and its split into changes) or tweak scope (a standalone change), ending with a design review and a walkthrough for your approval.
---

# Architect

Architect decides the how and the how big. It designs the domain, the ports and adapters, and where every element lives in the source tree, before any code exists. It ends with the one heavy human gate, the design walkthrough: a short overview in plain terms, after which the user reads the design documents in full and approves or comments.

## Steps

1. **Pick the scope.**
   - **Project scope:** `docs/architecture.md` doesn't exist yet. Reworking an approved architecture goes through `rethink` instead.
   - **Feature scope:** the user names a feature, or a feature folder exists without changes.
   - **Tweak scope:** the user asks for a small change to existing behaviour. When the design shows it needs any architecture change, it becomes a feature: say so and continue at feature scope.
   - Done when you can say which, and why.
2. **Check what it builds on.** Run `cruze status`. `docs/vision.md` must be approved and current. At feature and tweak scope, `docs/architecture.md` must be approved and current as well. When a document isn't, stop and name the step that fixes it: `envision` for the vision, and `rethink` for an architecture that changed since its approval.
3. **Read the living model.** Read `docs/vision.md`, `docs/glossary.md`, `docs/architecture.md` as "Reading it" in `.agents/skills/cruze-formats/reference/architecture.md` says, the ADRs in `docs/adr/`, `docs/roadmap.md`, `.cruze/config.yaml`, and the specs and code the work touches. Take up the notes and the parts of the user's input handed to this work, as "Taking up a hand-off later" in `.agents/skills/cruze-envision/intake.md` describes: at project scope, `cruze show --notes architect`, `cruze show --notes roadmap` and `cruze show --notes project`; at feature or tweak scope, the Notes section of `cruze show <feature>`. Read any other note the user points to.
4. **Load the standards.** Read these, and follow them for the rest of this step:
   - `.agents/skills/cruze-hexagonal-design/SKILL.md`
   - `.agents/skills/cruze-grilling/SKILL.md`
   - `.agents/skills/cruze-domain-language/SKILL.md`
   - `.agents/skills/cruze-research/SKILL.md`
   - `.agents/skills/cruze-dependency-approval/SKILL.md`
   - `.agents/skills/cruze-formats/reference/architecture.md`
5. **Design.** Follow the scope's procedure: [project.md](project.md), [feature.md](feature.md) or [tweak.md](tweak.md). Tweak scope ends there and hands off to `plan`.
6. **Review the design.** Run the design review in `.agents/skills/cruze-roles/SKILL.md`, with the design reviewer role. Done when every finding has a journaled disposition and no blocker is open without the user's decision.
7. **Hand the design to the user.** Follow [walkthrough.md](walkthrough.md): one overview message, then the documents to read in full. Apply what the user changes, run `cruze validate` again, and say what changed.
8. **Record the approval.** Only after the user says they approve, run the scope's `cruze approve` command and quote its result, then commit. At project scope, the roadmap follows as its own approval, described in [project.md](project.md).

## Rules

- **Design for the roadmap, build for the phase.** Read the whole feature map and roadmap. When a later feature will need a seam, name it now in a `Future` fact, such as "transport will gain MQTT in phase 3, so inbound adapters stay behind `CommandSource`". Build only what the current work needs.
- **Answer to the vision's long-term intent.** Read `## Principles` and `## Must stay possible` in `docs/vision.md`. Every design follows each principle. Check the design against every `LATER` row, not only those in its area: nothing in it may rule one out. Where the design touches a capability's area, leave the room its row names, in a `Future` fact that cites its ID, and build nothing for it. A design that would depart from a principle or close off a capability goes to the user first, as "Long-term intent" in `.agents/skills/cruze-grilling/SKILL.md` describes.
- **Adopt before you build.** Before designing any component that isn't domain logic, run the researcher role from `.agents/skills/cruze-roles/SKILL.md` on it. Record every decision in `## Adopt or build`, or at project scope in the adapter's `Adopts` fact. Every new dependency goes to the user through the dependency-approval skill.
- **Every element with code has a home.** Each `ENT`, `UC`, `PORT`, `ADP` and `FLOW` names its `Module` and `File`. Each file has one responsibility. Never split an owner across files to keep them short.
- **Comply with the references.** When the project must follow an external document, such as a protocol specification, it is listed under `references:` in `.cruze/config.yaml`; at project scope, ask the user whether there is one, and list it with what it governs. Read the parts each element relies on, and cite the section in the element's body, such as `RFC 4254 §5.2`, so plan, build and the reviewers can check it.
- **Ask, challenge and defer** as the grilling skill describes. Contexts, ports, public contracts, dependency direction and dependencies are always the user's decisions.
- **Stepping back is normal.** When the design shows that the vision or an earlier decision is wrong, stop and say so. The vision changes through `envision`, and an approved architecture through `rethink`.

## Next step

- Project scope: `plan` for the walking-skeleton change.
- Feature scope: `plan` for the feature's first change.
- Tweak scope: `plan` for the standalone change.

Plan branches from main, so get the approved design onto main first, as a pull request or a merge, together with the vision or feature map it builds on. A plan branched from an unmerged design branch carries the design into the change's pull request.

Start it in a new session, so its context starts empty.
