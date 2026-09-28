# The README never says what the project is

- Proposal: `envision` at project scope writes the README's overview under the title (what the product is, who it is for and why, from the vision's Problem, Users and Goals), a vision-level rethink keeps it current, and `cruze validate` warns `readme-overview` when the vision is approved and the README has no text before its first `##`.
- Evidence: the maintainer found that the project's README has no overview under its title. `templates/init/README.md` holds only the title, and no workflow step writes the overview; `architect` adds only `## Architecture`, and `land` adds only usage.
- Asset: skills/envision/project.md (step 9), skills/rethink/levels.md, src/domain/validation/project_rules.ts, src/app/project_context.ts (the view now reads README.md)

## Situation

On the console-access fixture, replace README.md with only its title, a logo and an `## Architecture` section, then approve the vision.

## Expected

`cruze validate` warns `readme-overview` on README.md once the vision is approved, and not before. A fresh `envision` run writes a paragraph under the title drawn from the vision, with a link to `docs/vision.md`, and the warning goes away.

## Check

A test in `test/validate.test.ts`: "warns, once the vision is approved, when the README has nothing under its title".
