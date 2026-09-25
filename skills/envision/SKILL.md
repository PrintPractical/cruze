---
name: cruze-envision
description: Decides what to build with the user, either for the whole project (problem, users, goals, non-goals, constraints, feature map and glossary) or for one feature (intent and requirements with scenarios), by grilling in rounds on the gaps.
---

# Envision

Envision decides the what: the problem, who has it, and the behaviour that solves it. It takes whatever drafts the user brings as input, finds the gaps, and grills in rounds until the user confirms a shared understanding. Architecture, modules and code belong to `architect`.

## Steps

1. **Pick the scope.** It is project scope when `docs/vision.md` doesn't exist yet, or when the user asks to rework the project's goals. It is feature scope when the user names a feature. When unsure, ask. Done when you can say which.
2. **Gather the input.** Read what the user gave you: pasted drafts, files they point to, and notes in `.cruze/notes/`. Read whichever of `docs/vision.md`, `docs/glossary.md`, `docs/roadmap.md` and `docs/architecture.md` exist, and run `cruze status`.
3. **Load the standards.** Read `.agents/skills/cruze-grilling/SKILL.md` and `.agents/skills/cruze-domain-language/SKILL.md`, and follow them for the rest of this step.
4. **Follow the scope's procedure.** For project scope, follow [project.md](project.md). For feature scope, follow [feature.md](feature.md). Each one ends with the user's confirmation.
5. **Check the documents.** Run `cruze validate`. Done when it reports no errors in the documents this step wrote. At feature scope, expect one `not-designed` warning for the feature, which `architect` clears.

## Rules

- Write in the user's terms and the glossary's words. Behaviour is described from outside the system: what a user does and what they observe.
- Requirements and scenarios follow `.agents/skills/cruze-formats/reference/specs.md`. Every scenario uses concrete values: real names, real inputs, exact output. The scenarios become the tests, so their values are the expected results.
- Keep implementation out: no modules, types, libraries or file formats unless the user names one as a constraint. When the user raises one, record it as a constraint or a settled decision and move on.
- The vision stays within one page, excluding the feature map.
- Only the CLI writes the feature map. Use `cruze features add` and `cruze features drop`.

## Next step

- After project scope: run `architect` at project scope.
- After feature scope: run `architect "<feature>"`.
