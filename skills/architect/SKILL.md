---
name: cruze-architect
description: Decides how to build and how big, at project scope (domain model, contexts, ports, adapters, module map, layer rules, ADRs and the roadmap with its walking skeleton), feature scope (the architecture delta and its split into changes) or tweak scope (a standalone change), ending with a design review and a walkthrough for your approval.
---

# Architect

Architect decides the how and the how big. It designs the domain, the ports and adapters, and where every element lives in the source tree, before any code exists. It ends with the one heavy human gate, the design walkthrough, where the user sees the entities, their interactions, the ports and the files, and approves the design.

## Steps

1. **Pick the scope.**
   - **Project scope:** `docs/architecture.md` doesn't exist yet. Reworking an approved architecture goes through `rethink` instead.
   - **Feature scope:** the user names a feature, or a feature folder exists without changes.
   - **Tweak scope:** the user asks for a small change to existing behaviour. When the design shows it needs any architecture change, it becomes a feature: say so and continue at feature scope.
   - Done when you can say which, and why.
2. **Check what it builds on.** Run `cruze status`. `docs/vision.md` must be approved and current. At feature and tweak scope, `docs/architecture.md` must be approved and current as well. When a document isn't, stop and name the step that fixes it: `envision` for the vision, and `rethink` for an architecture that changed since its approval.
3. **Read the living model.** Read `docs/vision.md`, `docs/glossary.md`, `docs/architecture.md`, the ADRs in `docs/adr/`, `docs/roadmap.md`, `.cruze/config.yaml`, and the specs and code the work touches. Read any note in `.cruze/notes/` the user points to.
4. **Load the standards.** Read these, and follow them for the rest of this step:
   - `.agents/skills/cruze-hexagonal-design/SKILL.md`
   - `.agents/skills/cruze-grilling/SKILL.md`
   - `.agents/skills/cruze-domain-language/SKILL.md`
   - `.agents/skills/cruze-research/SKILL.md`
   - `.agents/skills/cruze-dependency-approval/SKILL.md`
   - `.agents/skills/cruze-formats/reference/architecture.md`
5. **Design.** Follow the scope's procedure: [project.md](project.md), [feature.md](feature.md) or [tweak.md](tweak.md). Tweak scope ends there and hands off to `plan`.
6. **Review the design.** Run the design review in `.agents/skills/cruze-roles/SKILL.md`, with the design reviewer role. Done when every finding has a journaled disposition and no blocker is open without the user's decision.
7. **Walk the user through it.** Follow [walkthrough.md](walkthrough.md). Apply what the user changes, run `cruze validate` again, and repeat the parts of the walkthrough those changes affect.
8. **Record the approval.** Only after the user says they approve, run the scope's `cruze approve` command and quote its result, then commit. At project scope, the roadmap follows as its own approval, described in [project.md](project.md).

## Rules

- **Design for the roadmap, build for the phase.** Read the whole feature map and roadmap. When a later feature will need a seam, name it now in a `Future` fact, such as "transport will gain MQTT in phase 3, so inbound adapters stay behind `CommandSource`". Build only what the current work needs.
- **Adopt before you build.** Before designing any component that isn't domain logic, run the researcher role from `.agents/skills/cruze-roles/SKILL.md` on it. Record every decision in `## Adopt or build`, or at project scope in the adapter's `Adopts` fact. Every new dependency goes to the user through the dependency-approval skill.
- **Every element with code has a home.** Each `ENT`, `UC`, `PORT`, `ADP` and `FLOW` names its `Module` and `File`. Each file has one responsibility and fits the budget in `.cruze/config.yaml`.
- **Ask, challenge and defer** as the grilling skill describes. Contexts, ports, public contracts, dependency direction and dependencies are always the user's decisions.
- **Stepping back is normal.** When the design shows that the vision or an earlier decision is wrong, stop and say so. The vision changes through `envision`, and an approved architecture through `rethink`.

## Next step

- Project scope: `plan` for the walking-skeleton change.
- Feature scope: `plan` for the feature's first change.
- Tweak scope: `plan` for the standalone change.
