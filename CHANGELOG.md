# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.0.1] - 2026-09-24

The first preview release. It covers the whole greenfield workflow, from an idea to a landed change, and has been tested with Claude Code.

### Added

- **Setup.**
  - `cruze init` sets up a repository with a README, changelog, `AGENTS.md`, `CLAUDE.md`, `.cruze/config.yaml`, a CI workflow that runs `cruze validate`, `check` and `trace`, and a `.gitattributes` that merges Cruze's journals line by line. It never overwrites existing files.
  - `cruze install` installs or updates the skills in `.agents/skills/` and links them into `.claude/skills/` for Claude Code.
  - Cruze installs from GitHub without npm, with `npm install -g github:PrintPractical/cruze#v0.0.1`. `cruze init --package <spec>` makes the CI it writes run that same source.
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

[Unreleased]: https://github.com/PrintPractical/cruze/compare/v0.0.1...HEAD
[0.0.1]: https://github.com/PrintPractical/cruze/releases/tag/v0.0.1
