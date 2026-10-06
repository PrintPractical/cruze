# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- A `core` layer for a module that holds a context's domain and application together. A context now starts with one core module and its adapters, and splits into `domain` and `application` only when its domain needs a boundary of its own, recorded as a decision.
- A guide to the normal layout for a library, a daemon or service, a mobile or desktop app, and a CLI, in the `cruze-hexagonal-design` skill. Architect names the kind of system in the Overview and starts from that layout.
- A Swift language file: few package targets, `package` and `@testable import` instead of `public` where they will do, screens and their models as inbound adapters, and package tests separate from UI tests.

### Changed

- Rust projects split crates by deliverable, such as a library, a client, a daemon and a CLI, and keep layers as modules inside a crate. Before, the Rust guide suggested a crate per layer.
- The design reviewer reports a layout that isn't normal for the kind of system and its language, and any layer, module or target split without a recorded reason. Before, an iPhone app came out as a package target per layer per context, with over a thousand `public` declarations.

## [0.0.6] - 2026-10-05

Less waiting per change, from the 0.0.5 journals of two projects and one project's session transcripts: a 25-minute test suite ran about four times per change, every fresh round-2 review found nothing, and most rethinks came from claims nobody had checked or from parts of the design that contradicted each other. The design walkthrough is one message now, and the full suite runs once per commit. Existing projects upgrade as the README's Upgrading section says. Every change applies to new work only, and a project with slow UI or device tests can move them to `test_full`.

### Added

- `cruze journal add checks --set commit=<commit>` records the commit where the format, lint, build and full test suite passed, so a later step quotes it instead of running them again.
- `test_full` under `commands:` in `.cruze/config.yaml`, for projects with a slow tier such as UI or device tests. `test` then runs the fast tier after every task, and `test_full` runs once per change.

### Changed

- The full test suite runs once per commit. Verify quotes build's result when no code changed since it, the verifier builds the system and runs the scenarios without rerunning the suite, verify runs it once more only after code-review fixes, and land leaves it to CI when main came in without code conflicts. A project with a 25-minute suite ran it about four times per change before.
- The design walkthrough in `architect` and `rethink` is one message: a short overview in use-case terms, then the documents for the user to read in full and approve or comment on. Before, the agent presented the design in nine parts and paused after each.
- Build extends the shared test support module as part of any task that writes tests, recording it as a deviation, instead of stopping for a rethink. Before, the rule against files outside the owner's module pushed agents to write private test helpers that code review then moved.
- Plan names the break that a test expecting a default or empty result is first seen failing against, since such a test passes against a stub.
- Round 2 of a review is checked by the agent when every blocker was fixed exactly as the reviewer proposed, and by a fresh reviewer only when a fix differs or goes further. `cruze journal add review` takes `checked_by=agent|reviewer`. In two projects, ten fresh round-2 reviews found nothing.
- Architect clears its size warnings before the design is approved, or records the user accepting them, and the walkthrough lists any warning still standing. The design reviewer reports an unaccepted size warning. Before, a feature was approved with two changes over the scenario limit.
- Research checks every claim the design or its testing approach relies on, including claims about the language, the platform's test environment and the external systems the product talks to, by running them where it can. Before, it checked only adopted libraries and tools.
- The design reviewer checks cross-cutting rules against each other and against the layer rules, use cases that change the same state for interleavings, and at feature scope, architecture prose the delta makes untrue.

### Fixed

- `cruze new feature` and `cruze new change` quote the title in the YAML header. A title with a colon, such as `Consume properties: get and set`, broke the header, and `cruze status` and `cruze check` crashed until the title was quoted by hand.

## [0.0.5] - 2026-10-04

Less ceremony per change, from the journals of two projects: the user agreed with 98% of review findings, round 2 rarely found a blocker still open, and small changes paid the same plan and verify cost as large ones. The user now decides what is theirs to decide, and each change carries more work. Existing projects upgrade as the README's Upgrading section says. The new size warnings apply to new work only, and a project that wants to keep deciding every review finding sets `review.decide: all`.

### Added

- `cruze approve <change> --by-agent` approves a feature's change for the user once its plan review has closed: a plan review recorded since the change was last approved, no blocker open in its last round, and a disposition for every finding. It refuses with `plan-review-open` otherwise, and refuses a feature, a standalone change or a project document with `needs-user`. `plan` now ends approved, and the user can object or go straight to `build`.
- `cruze approve <ref> --restamp-unchanged` re-stamps a feature or change that a rethink left unchanged, when only something it cites changed. It refuses work whose own text changed, a project document, and a change with a task reopened since its approval. Before, the user re-approved every change under a feature after each feature rethink.
- Approvals the agent gives record their basis, `plan-review` or `rethink`, and `cruze status` says so.
- `cruze journal add disposition` takes `decided=agent|user`, and refuses `decided=agent` for anything but `fixed`.
- `review.decide` in `.cruze/config.yaml`: `exceptions` (the default) or `all`.
- `cruze validate` warns `change-too-small` when a feature's change builds fewer than 3 elements, `change-too-large` when a change delivers more than 30 scenarios, and `plan-too-large` when a plan has more than 25 tasks. `changes:` in `.cruze/config.yaml` sets the thresholds.

### Changed

- Reviews bring the user only the exceptions: findings whose fix changes behaviour, a designed port or contract, or another decision the user owns, and findings the agent would waive, defer, reject or fix differently from the proposal. The agent fixes the rest, blockers included, and lists them, and the user can object to any.
- `architect` sizes changes at about 8 to 25 tasks, and merges small changes that continue each other on the same adapters or screens. Before, it split any change of more than about 12 tasks.
- Reviewers list concerns in proportion to the work: at most 5, or one per 5 tasks of a plan or change when that is more. No concerns is a valid report.

### Fixed

- A change approved after its verification, with a changed plan, needs verifying again even when the agent gave the approval. Only `land`'s re-stamps are ignored.

## [0.0.4] - 2026-10-01

Fixes from the first projects on 0.0.3. Existing projects upgrade as the README's Upgrading section says. Every command now prints its result on stdout in one format and refuses options it doesn't take, so a script that read the text summary from stderr, or passed a command an option it ignored, needs updating.

### Added

- `cruze features update <slug> --summary <text>` corrects a feature's summary on the feature map, on the future or the implemented list. Envision runs it when a decision changes what the summary promised, and land checks the summary when a feature finishes. Before, land carried the summary from when the feature was added, even after the feature's decisions had replaced it.

### Changed

- Every command refuses an option it doesn't take, with a usage error naming the options it does take, instead of ignoring it. `cruze validate --item x` and `cruze journal list --change x` exit with 2. `cruze status` refuses `--override` without `--gate`, `--change` without `--overlap`, and both modes at once; `cruze review` refuses `--blockers` without `--round 2`.
- Every command prints its result on stdout in one format: JSON when stdout isn't a terminal or with `--json`, and text on a terminal or with the new `--text`. stderr carries only errors and notes. Before, the text went to stderr alongside the JSON, so `cruze journal list | grep` filtered only the JSON, and agents got every result twice.

### Fixed

- `cruze status --overlap` ignores changes that have landed, here or on their own branch. It reported a branch that had already merged and been archived.
- `cruze status --overlap` counts only the elements a change's scope and delta name. It counted an element the other change named only as a test seam.
- `cruze journal list --item <ref>` lists that change's entries, or a feature's and its changes'. It ignored `--item` and listed the whole project's.
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

[Unreleased]: https://github.com/PrintPractical/cruze/compare/v0.0.6...HEAD
[0.0.6]: https://github.com/PrintPractical/cruze/compare/v0.0.5...v0.0.6
[0.0.5]: https://github.com/PrintPractical/cruze/compare/v0.0.4...v0.0.5
[0.0.4]: https://github.com/PrintPractical/cruze/compare/v0.0.3...v0.0.4
[0.0.3]: https://github.com/PrintPractical/cruze/compare/v0.0.2...v0.0.3
[0.0.2]: https://github.com/PrintPractical/cruze/compare/v0.0.1...v0.0.2
[0.0.1]: https://github.com/PrintPractical/cruze/releases/tag/v0.0.1
