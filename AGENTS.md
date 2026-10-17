# Cruze

Instructions for coding agents working on Cruze itself. Cruze is an npm package (`@printpractical/cruze`) containing a CLI and a set of Agent Skills; see README.md for what it does.

## Commands

- `npm ci`: install dependencies. The only runtime dependency is `yaml`.
- `npm run check`: typecheck, test and build. Run it before every commit.
- `npm test`: run `node --test` over `test/**/*.test.ts`. Node runs the TypeScript directly.
- `node src/main.ts <command>`: run the CLI from source.

## Layout

The CLI is hexagonal. Dependencies point inward, and only `src/main.ts` constructs adapters.

- `src/domain/`: pure rules that work on a snapshot of the project's files. Imports nothing outside `domain/` except Node's `crypto`/`path` and the `yaml` parser.
  - `markdown.ts`, `markdown_tables.ts`, `ids.ts`, `hashing.ts`: parsing documents, scenario IDs, and hashing design content.
  - `project/`: the document layout, feature files, the vision's Release table, and the loader that reads them together.
  - `approvals.ts`, `next_step.ts`: approval state and the next step.
  - `validation/`: the format rules from the cruze-formats skill.
  - `check/`, `trace.ts`: layer rules, file budgets and scenario traceability.
  - `skill.ts`, `skill_links.ts`, `skill_budget.ts`: the format of bundled skills, the pointers between their files, and their word budget.
- `src/app/ports/`: capabilities the use cases need, named by capability (`ProjectFiles`, `Bundle`, `Prompter`, `Clock`, `Repository`, `AgentRunner`).
- `src/app/project_context.ts`: loads the project's documents for the use cases.
- `src/app/use_cases/`: one file per use case.
- `src/adapters/inbound/cli/`: argument parsing, the command table in `commands.ts`, handlers grouped in `commands/`, output.
- `src/adapters/outbound/`: Node filesystem, git, the package bundle reader, the terminal prompter, the review agent runner.
- `src/main.ts`: composition root. `bin/cruze.mjs` is the `cruze` bin: it runs `dist/main.js`, building it first when missing.
- `skills/<folder>/SKILL.md`: bundled skills, installed into projects as `cruze-<folder>`.
- `skills/formats/`: the contract for every project document, with templates. Skills and the CLI both read it, so change a format there and nowhere else.
- `skills/envision/`, `shape/`, `build/`, `review/`, `fix/`: workflow skills, the steps a person runs. Each ends by naming the next step.
- `skills/asking/`, `hexagonal-design/`, `behavioural-testing/`, `dependency-approval/`, `research/`: knowledge skills, the standards that workflow skills load by installed path.
- `skills/roles/`: prompts for the fresh-context code reviewer and researcher. `cruze review` runs them when the agent has no helper.
- `examples/console-access/`: a worked example project in those formats. It is not shipped. Keep it valid, because it serves as the CLI's test fixture.
- `templates/`: files `cruze init` renders into projects, with `{{placeholders}}`.
- `test/`: behaviour tests through the use cases, run against in-memory copies of `examples/console-access` (`test/support/harness.ts`), with fakes in `test/fakes/`; a lint of the shipped bundle, including every pointer between skill files; and a CLI smoke test.

## Conventions

- Many small modules: one responsibility per file, and a file stays under 250 lines. When a file gains a second responsibility, split it.
- Prefer Node built-ins. A new runtime dependency needs explicit approval from the maintainer.
- CLI output: the result on stdout in one format, JSON for agents (stdout not a terminal, or `--json`) or text for people (a terminal, or `--text`). stderr carries only errors and notes. Expected failures throw `CruzeError` with a stable `code`.
- Write erasable TypeScript only (no enums, namespaces or parameter properties), so Node can run sources directly. Relative imports use the `.ts` extension; the build rewrites them.
- Test behaviour through use cases with fakes that honour the port contracts. Unit-test domain rules directly only when the logic is non-trivial.
- Skills follow [docs/contributing/writing-skills.md](docs/contributing/writing-skills.md), and `test/bundle.test.ts` enforces the format.
- Skills have a word budget, `BUNDLE_WORD_BUDGET` in `src/domain/skill_budget.ts`, and a 2,100-word limit per file. A change that adds skill text removes what it makes redundant, or raises the budget with the reason in its commit; one that cuts text lowers it.
- Commit messages follow Conventional Commits. Record user-visible changes under `[Unreleased]` in `CHANGELOG.md`.

## Known pitfalls

- A feature's `- Status:` line must stay out of its hash, or marking a feature built will make its approved design look edited. When adding a CLI write to a document, add a test that its approval stays current across it.
- Claude Code does not read `.agents/skills/`. It only finds Cruze skills through the links `cruze install` creates in `.claude/skills/`.
- Never run `cruze init` or `cruze install` with this repository as the working directory: install replaces every `cruze-*` skill it finds. Try them in a temporary directory.
- Bumping the version in `package.json` also bumps `cruze:` in `examples/console-access/.cruze/config.yaml`, or the fixture reports a `cruze-version` warning and the tests fail.
- A new CLI option goes in `parse_command.ts` and in the `options` of each command that takes it in `commands.ts`, or the CLI refuses it. `test/command_lines.test.ts` checks every command line the skills and templates spell out against those lists.
- `npx <path-to-tarball>` fails. Use `npx --package=<tarball> cruze ...` to try a packed build.
- The build is `scripts/build.mjs`: Node's type stripper over `src/`, with no dependencies. Don't add install scripts (`prepare`, `postinstall`). npm skips them for global installs, and a git install relies on `bin/cruze.mjs` building `dist/` on first run instead.
- Every step, question and document an agent must read costs the user time. A change that adds one needs evidence from a real project that it catches what the user cares about.
