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
- The workflow: `explore` (optional), `envision` for the what, `architect` for the how, `roadmap` for the order of work, then `plan`, `build`, `verify` and `land` for each change. `triage` handles bugs, `rethink` steps back from anywhere, and `next` says what to do now.

When the user asks what Cruze can do:

1. Read `.cruze/config.yaml` and report the project name and Cruze version.
2. Run `cruze --version`, and say whether it differs from the version in `.cruze/config.yaml`. When `cruze` isn't found, tell the user to install it globally with `npm install -g @printpractical/cruze`, or `npm install -g github:PrintPractical/cruze#<tag>` from GitHub; every Cruze skill needs it.
3. Run `cruze next` and explain the step it names, in the context of the whole workflow.
