# Cruze

Instructions for coding agents working on Cruze itself. Cruze is an npm package (`@printpractical/cruze`) containing a CLI and a set of Agent Skills; see README.md for what it does.

## Commands

- `npm ci`: install dev dependencies. There are no runtime dependencies.
- `npm run check`: typecheck, test and build. Run it before every commit.
- `npm test`: run `node --test` over `test/**/*.test.ts`. Node runs the TypeScript directly.
- `node src/main.ts <command>`: run the CLI from source.

## Layout

The CLI is hexagonal. Dependencies point inward, and only `src/main.ts` constructs adapters.

- `src/domain/`: pure rules, such as project names, the skill format, the init scaffold and where agents look for skills. Imports nothing outside `domain/`.
- `src/app/ports/`: capabilities the use cases need, named by capability (`ProjectFiles`, `Bundle`, `Prompter`).
- `src/app/use_cases/`: one file per use case.
- `src/adapters/inbound/cli/`: argument parsing, one handler per command in `commands/`, output.
- `src/adapters/outbound/`: Node filesystem, the package bundle reader, the terminal prompter.
- `src/main.ts`: composition root and the `cruze` bin.
- `skills/<folder>/SKILL.md`: bundled skills, installed into projects as `cruze-<folder>`.
- `templates/`: files the CLI renders into projects, with `{{placeholders}}`.
- `test/`: behaviour tests through the use cases with in-memory fakes in `test/fakes/`, a lint of the shipped bundle, and a CLI smoke test.

## Conventions

- Many small modules: one responsibility per file, and a file stays under 250 lines. When a file gains a second responsibility, split it.
- Prefer Node built-ins. A new runtime dependency needs explicit approval from the maintainer.
- CLI output: JSON on stdout for agents, human text on stderr. Expected failures throw `CruzeError` with a stable `code`.
- Write erasable TypeScript only (no enums, namespaces or parameter properties), so Node can run sources directly. Relative imports use the `.ts` extension; the build rewrites them.
- Test behaviour through use cases with fakes that honour the port contracts. Unit-test domain rules directly only when the logic is non-trivial.
- Skills follow [docs/contributing/writing-skills.md](docs/contributing/writing-skills.md), and `test/bundle.test.ts` enforces the format.
- Commit messages follow Conventional Commits. Record user-visible changes under `[Unreleased]` in `CHANGELOG.md`.

## Known pitfalls

- Claude Code does not read `.agents/skills/`. It only finds Cruze skills through the links `cruze install` creates in `.claude/skills/`.
- `npx <path-to-tarball>` fails. Use `npx --package=<tarball> cruze ...` to try a packed build.
