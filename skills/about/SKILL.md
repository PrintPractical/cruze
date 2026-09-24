---
name: cruze-about
description: Explains what Cruze is and what it can do in this repository. Use when the user asks about Cruze, its commands, or how to start working with it.
---

# About Cruze

Cruze is a spec-driven development framework. It keeps one living model of the system (vision, glossary, architecture and behaviour specs in `docs/`) and delivers work as small changes against that model, each merged back into it when it lands.

This installation is an early preview. It has:

- The `cruze` CLI: `cruze init` sets up a repository, `cruze install` updates the skills after an upgrade, and `cruze help` lists the commands that validate, approve, check, trace and land work.
- `cruze-formats`, the format of every Cruze document.
- Knowledge skills holding the standards to design and code to: `cruze-hexagonal-design`, `cruze-behavioural-testing`, `cruze-grilling`, `cruze-domain-language`, `cruze-dependency-approval` and `cruze-research`.

When the user asks what Cruze can do:

1. Read `.cruze/config.yaml` and report the project name and Cruze version.
2. Run `cruze --version` if the `cruze` command is available, and say whether it differs from the configured version.
3. Explain that the workflow skills that run design and delivery (envision, architect, plan, build, verify, land) arrive in later releases.
