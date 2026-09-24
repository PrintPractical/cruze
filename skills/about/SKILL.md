---
name: cruze-about
description: Explains what Cruze is and what it can do in this repository. Use when the user asks about Cruze, its commands, or how to start working with it.
---

# About Cruze

Cruze is a spec-driven development framework. It keeps one living model of the system (vision, glossary, architecture and behaviour specs in `docs/`) and delivers work as small changes against that model, each merged back into it when it lands.

This installation is an early preview. Only the setup commands exist so far:

- `cruze init` sets up a repository: README, changelog, CI stub, `AGENTS.md`, `.cruze/config.yaml`, and these skills.
- `cruze install` updates the Cruze skills after upgrading the package.

When the user asks what Cruze can do:

1. Read `.cruze/config.yaml` and report the project name and Cruze version.
2. Run `cruze --version` if the `cruze` command is available, and say whether it differs from the configured version.
3. Explain that the design and delivery skills (envision, architect, plan, build, verify, land) arrive in later releases.
