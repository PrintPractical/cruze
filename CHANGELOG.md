# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed

- `cruze review --blockers` and `cruze feedback export --out` accept a file outside the project, such as one in an agent's scratch directory. The review crashed on such a path. A project path that leads outside the project now fails with the `outside-project` error instead of a stack trace.

## [0.0.3] - 2026-09-29

Cruze stops assuming Claude Code, after a project on OpenCode had its review try to run `claude`. Existing projects upgrade as the README's Upgrading section says. A project on another agent should also delete `review.command` from `.cruze/config.yaml`, so its reviews run in its own agent.

### Changed

- `cruze init` asks which coding agent you use, `claude` or `other`, unless `--agent` names it or the repository already has `CLAUDE.md` or `.claude/`. Only Claude Code gets `CLAUDE.md`, the `.claude/skills/` links and a `review.command`. With `--yes`, or without a terminal, it sets up Claude Code, as before.
- `CLAUDE.md` is a link to `AGENTS.md` instead of a file importing it.
- `review.command` has no default. Without it, `cruze review` hands the role's prompt to the calling agent to run in a helper. A project on another agent that `init` set up for Claude Code can delete the setting.

### Fixed

- `cruze review` no longer fails when the agent under `review.command` isn't installed, such as Claude Code in a project that uses OpenCode. It reports `status: run-in-helper` with the role's full prompt, and the calling agent runs that prompt in a helper of its own.

## [0.0.2] - 2026-09-28

Most of these changes come from the first retro, on a real project's feedback bundle and a review of its code. Existing projects upgrade as the README's Upgrading section says: install the new CLI, run `cruze install`, then `realign` when it suits you.

### Added

- `cruze install` records the installed version as `cruze:` in `.cruze/config.yaml`, and moves the CI workflow to it when CI runs the npm package, a release tarball or a release tag. It refuses to install an older version over a project that moved to a newer one.
- Every `cruze` command notes on stderr when the project's skills are from a different Cruze than the CLI, even when the command fails, and `cruze validate` reports it as a `cruze-version` warning.
- The README's Upgrading section: upgrade the CLI, run `cruze install` in each repository, commit, then realign the code.
- The `realign` skill brings existing code up to what a new Cruze expects. It reads each release's notes since the code's `standards:` version, runs their CLI rules, has a new fresh-context auditor role answer the rest, decides each finding with you, and schedules the fixes as prefactor changes. `--full` audits against every release.
- `cruze realign status` and `cruze realign done`. `done` moves `standards:` up, and lists files still waiting for their prefactor under `check.exceptions`, which `cruze land` removes when that change lands. `cruze next` suggests realigning when nothing else is due.
- A rule a release adds reports on existing code at once, but fails no CI until the project realigns past it, so upgrading never turns CI red.
- `cruze validate` warns `outside-module-map` when a task writes a source file that no module's `Path` covers, at plan time instead of in CI.
- `cruze validate` warns `feature-size` when a feature has more than 6 changes, and `architect` splits such a feature.
- `cruze validate` warns `readme-overview` once the vision is approved and the README says nothing under its title. `envision` now writes that overview, and a vision-level rethink keeps it current.
- `cruze check` reports `test-placement` for Rust tests split into files under `src/`, such as `src/<module>/tests.rs`. The Rust notes say where they go instead: the crate's `tests/` directory, grouped into a few binaries.
- The behavioural-testing skill has a test support section: one fixture per domain value and one harness per seam, reused rather than redefined. In a Rust workspace, tests share them through a dev-only crate rather than `#[path]` includes.

### Changed

- `cruze journal add rethink` takes `found_by`, plus `missed_by` for a defect, each one of a fixed list of steps, in place of free-text `caught_by`. Review rounds record `nits`, and their counts are stored as numbers.
- The design reviewer treats two elements that contradict each other as a blocker, and checks every use case, adapter and guarantee against the elements it must agree with. It also checks that each change builds whole elements and names every dependency, that adopted libraries name the features the design uses, and that nothing is designed that no requirement asks for.
- Research verifies each claim the design relies on, such as a library's features or a CI command, by running it before the design review. An unverified claim is a blocker.
- The code reviewer marks a finding that needs a design change, and treats it and an adapter that can't honour its port as blockers. Such a finding goes to `rethink` instead of being deferred or waived. Code built only for a later change is a Scope finding.
- The hexagonal-design error rules ask for an error type only where a caller handles its cases differently. A use case returns or wraps the domain error instead of copying it, similar failures share one type, and a function returns only the failures its callers can meet. The Rust notes no longer ask for an error enum per domain, use case and adapter.
- `plan` lists every file a changed signature or default breaks, splits files before a task takes them past their budgets, gives each new item to the task of its first user when the linter rejects unused code, and splits test files by behaviour, not size.

### Fixed

- `cruze land` refuses a merge that would leave errors in the feature or changes it lands, such as a decision citing an ID the change removes. Before, it checked only `docs/`.

## [0.0.1] - 2026-09-24

The first preview release. It covers the whole greenfield workflow, from an idea to a landed change, and has been tested with Claude Code.

### Added

- **Setup.**
  - `cruze init` sets up a repository with a README, changelog, `AGENTS.md`, `CLAUDE.md`, `.cruze/config.yaml`, a CI workflow that runs `cruze validate`, `check` and `trace`, and a `.gitattributes` that merges Cruze's journals line by line. It never overwrites existing files.
  - `cruze install` installs or updates the skills in `.agents/skills/` and links them into `.claude/skills/` for Claude Code.
  - Cruze installs without npm, from the package attached to each GitHub Release, or from the git repository. `cruze init --package <spec>` makes the CI it writes run that same source.
- **Workflow skills,** the commands a person runs:
  - `explore` (optional), `envision` (project or feature scope) and `architect` (project, feature or tweak scope, ending with a design review and a walkthrough).
  - `roadmap`, `plan`, `build` (test-first, one checked commit per task), `verify` (a fresh-context verifier that runs the real system, a two-lane code review and a manual test script) and `land`.
  - `triage` for bugs, `rethink` to step back from any point, and `next`.
- **Knowledge skills** holding the standards an agent designs and codes to: `hexagonal-design` (with Rust and C++ notes), `behavioural-testing`, `grilling`, `domain-language`, `dependency-approval` and `research`.
- **Formats.** `formats` defines every Cruze document, with templates: vision, glossary, architecture, ADRs, specs with requirements and scenarios, features and changes with their deltas, scope, test plans and tasks, the roadmap, and the config.
- **Roles.** `roles` holds the fresh-context design reviewer, code reviewer, verifier and researcher, and the two-round review procedure in which every finding gets a recorded disposition.
- **The CLI owns every deterministic step:**
  - `cruze validate` checks every document against the formats.
  - `cruze approve` binds an approval to content hashes, and `cruze status` computes each document's state from them, so editing an upstream document is how you step back.
  - `cruze status --gate build` and `--overlap`, and `cruze next`, which names the step to run next and why.
  - `cruze new` creates documents and work from templates, with dated IDs that are never reused.
  - `cruze task`, `cruze features`, `cruze roadmap prune`, `cruze abandon` and `cruze journal` record progress and events.
  - `cruze trace` links scenarios to tests. `cruze check` enforces layer rules and file budgets for TypeScript/JavaScript, Python, Rust, Go, C/C++ and Java/Kotlin.
  - `cruze land` merges a verified change into the living docs, refuses to overwrite edits it would lose, re-stamps the approvals the merge would make stale, keeps `AGENTS.md` current, and archives finished work.
  - `cruze review` runs a review role in a fresh agent context.
  - `cruze feedback export` bundles the journal, redacted by default, for improving Cruze.

[Unreleased]: https://github.com/PrintPractical/cruze/compare/v0.0.3...HEAD
[0.0.3]: https://github.com/PrintPractical/cruze/compare/v0.0.2...v0.0.3
[0.0.2]: https://github.com/PrintPractical/cruze/compare/v0.0.1...v0.0.2
[0.0.1]: https://github.com/PrintPractical/cruze/releases/tag/v0.0.1
