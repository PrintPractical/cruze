# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- `cruze init` sets up a repository with a README, changelog, `AGENTS.md`, `CLAUDE.md`, `.cruze/config.yaml` and a CI stub, without overwriting existing files, then installs the skills.
- `cruze install` installs or updates the Cruze skills in `.agents/skills/` and links them into `.claude/skills/` for Claude Code.
- The `cruze-about` skill, which describes Cruze in an initialized repository.
- The `cruze-formats` skill, which defines the format of every Cruze document. It covers IDs and elements, the architecture, specs with requirements and scenarios, spec and architecture deltas, features and changes with their scope rules, test plans and task lines, and the configuration file. It ships a template for each document.
- `.cruze/config.yaml` gains `source` and `tests` globs, and `check.exceptions` entries now carry a reason.
- `cruze validate` checks every document against the formats.
- `cruze approve` and `cruze status` handle approvals. An approval is bound to content hashes: the document's design hash plus a hash of each upstream element it cites. Status is computed from content, so editing an upstream document is how you step back.
- `cruze status --gate build` checks that this branch's change, its feature and the architecture are approved and current, with a journaled override. `--overlap` finds work on other branches that touches the same elements.
- `cruze new` creates features, changes and ADRs from their templates, with dated IDs that are never reused.
- `cruze task`, `cruze features` and `cruze journal` record progress, the feature map and events. `cruze feedback export` produces a redacted bundle for the framework feedback loop.
- `cruze trace` links scenarios to tests. `cruze check` enforces layer rules and file budgets for TypeScript/JavaScript, Python, Rust, Go, C/C++ and Java/Kotlin.
- `cruze land` merges a finished change into the living docs. It refuses conflicting edits, verifies the merge, re-stamps the approvals the merge would otherwise make stale, and archives finished work.

### Changed

- Contexts and modules in the architecture no longer list their members (`Owns`). An element's scope and its `Module` fact are the single source of that membership, so adding an element to a module no longer makes other work citing the module stale.
