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
