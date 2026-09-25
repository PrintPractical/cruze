# Cruze

Instructions for coding agents working on Cruze itself. Cruze is an npm package (`@printpractical/cruze`) containing a CLI and a set of Agent Skills; see README.md for what it does.

## Commands

- `npm ci`: install dev dependencies. There are no runtime dependencies.
- `npm run check`: typecheck, test and build. Run it before every commit.
- `npm test`: run `node --test` over `test/**/*.test.ts`. Node runs the TypeScript directly.
- `node src/main.ts <command>`: run the CLI from source.

## Layout

The CLI is hexagonal. Dependencies point inward, and only `src/main.ts` constructs adapters.

- `src/domain/`: pure rules that work on a snapshot of the project's files and return new text. Imports nothing outside `domain/` except Node's `crypto`/`path` and the `yaml` parser.
  - `markdown.ts`, `elements.ts`, `ids.ts`, `hashing.ts`: parsing documents into elements and hashing their design content.
  - `project/`: the living-docs model, work items and their parts, and the project view that loads them together.
  - `validation/`: one file per group of rules from the cruze-formats skill.
  - `approvals/`, `status/`: fingerprints, computed approval state, the build gate.
  - `edits/`: the only code that writes managed content (status lines, progress, managed tables).
  - `land/`: merging deltas into living docs, and the bookkeeping of a land.
  - `check/`, `trace.ts`: layer rules, file budgets and scenario traceability.
  - `skill.ts`, `skill_links.ts`: the format of bundled skills, and the pointers between their files.
- `src/app/ports/`: capabilities the use cases need, named by capability (`ProjectFiles`, `Bundle`, `Prompter`, `Clock`, `Repository`, `AgentRunner`).
- `src/app/project_context.ts`: loads the project view and appends journal entries for the use cases.
- `src/app/use_cases/`: one file per use case.
- `src/adapters/inbound/cli/`: argument parsing, the command table in `commands.ts`, handlers grouped in `commands/`, output.
- `src/adapters/outbound/`: Node filesystem, the package bundle reader, the terminal prompter.
- `src/main.ts`: composition root and the `cruze` bin.
- `skills/<folder>/SKILL.md`: bundled skills, installed into projects as `cruze-<folder>`.
- `skills/formats/`: the contract for every project document (IDs, elements, deltas, scope rules), with templates. Skills and the CLI both read it, so change a format there and nowhere else.
- `skills/hexagonal-design/`, `behavioural-testing/`, `grilling/`, `domain-language/`, `dependency-approval/`, `research/`: knowledge skills, the standards that workflow skills load by installed path.
- `skills/explore/`, `envision/`, `architect/`, `roadmap/`, `plan/`, `build/`, `verify/`, `land/`, `triage/`, `rethink/`, `next/`: workflow skills, the commands a person runs. Each ends by naming the next step.
- `skills/roles/`: prompts for fresh-context roles (design reviewer, code reviewer, verifier, researcher), and the review procedure every workflow skill shares. `cruze review` runs them when the agent has no helper.
- `examples/console-access/`: a worked example project in those formats. It is not shipped. Keep it valid, because it serves as the CLI's test fixture.
- `templates/`: files the CLI renders into projects, with `{{placeholders}}`.
- `evals/`: checks of skills against real agent runs, starting with the load check (`evals/README.md`). Not shipped.
- `test/`: behaviour tests through the use cases, run against in-memory copies of `examples/console-access` (`test/support/harness.ts`), with fakes in `test/fakes/`; a lint of the shipped bundle, including every pointer between skill files; tests of the eval tools; and a CLI smoke test.

## Conventions

- Many small modules: one responsibility per file, and a file stays under 250 lines. When a file gains a second responsibility, split it.
- Prefer Node built-ins. A new runtime dependency needs explicit approval from the maintainer.
- CLI output: JSON on stdout for agents, human text on stderr. Expected failures throw `CruzeError` with a stable `code`.
- Write erasable TypeScript only (no enums, namespaces or parameter properties), so Node can run sources directly. Relative imports use the `.ts` extension; the build rewrites them.
- Test behaviour through use cases with fakes that honour the port contracts. Unit-test domain rules directly only when the logic is non-trivial.
- Skills follow [docs/contributing/writing-skills.md](docs/contributing/writing-skills.md), and `test/bundle.test.ts` enforces the format.
- Commit messages follow Conventional Commits. Record user-visible changes under `[Unreleased]` in `CHANGELOG.md`.

## Known pitfalls

- Anything the CLI writes inside a managed block or a `- Status:` line must stay out of every hash, or routine bookkeeping will make designs look edited. When adding a CLI write, add a test that approvals stay current across it.

- Claude Code does not read `.agents/skills/`. It only finds Cruze skills through the links `cruze install` creates in `.claude/skills/`.
- `npx <path-to-tarball>` fails. Use `npx --package=<tarball> cruze ...` to try a packed build.
