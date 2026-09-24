# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- `cruze init` sets up a repository with a README, changelog, `AGENTS.md`, `CLAUDE.md`, `.cruze/config.yaml` and a CI stub, without overwriting existing files, then installs the skills.
- `cruze install` installs or updates the Cruze skills in `.agents/skills/` and links them into `.claude/skills/` for Claude Code.
- The `cruze-about` skill, which describes Cruze in an initialized repository.
