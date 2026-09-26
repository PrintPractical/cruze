# Cruze

<p align="center">
  <img src="docs/assets/cruze-logo.jpg" alt="Cruze" width="720">
</p>

Cruze is a spec-driven development framework for coding agents. It keeps one living model of your system (vision, glossary, architecture and behaviour specs) and delivers work as small changes against that model. Each change is merged back into the model when it lands, so the architecture an agent reads on the tenth change is as current as it was on the first.

It works with any agent that supports the [Agent Skills](https://agentskills.io) format. It ships as one npm package: a `cruze` CLI that owns every deterministic step (IDs, approvals, checks, merges) and a set of skills that guide the agent through design and delivery.

## Status

Version 0.0.1 is the first preview. Early development. The CLI is complete for the V1 lifecycle. The document formats ship as the `cruze-formats` skill, the standards an agent designs and codes to ship as knowledge skills, and the whole workflow, from explore to land, ships as workflow skills. Claude Code is the agent tested so far.

## Why

Spec-driven workflows tend to fail in the same few ways:

- The architecture drifts after a few changes, because design decisions die with the change that made them.
- Stepping back to fix a design mid-implementation breaks the workflow's state.
- Code lands in a handful of oversized files, because nothing owns module structure before code is written.
- Everything is "fully specified", yet the result fails when a person actually uses it.
- Review loops keep finding new things to change and never converge.

Cruze answers each of these with a specific mechanism. A living `docs/architecture.md` is read at every step and updated by every change. Approvals are bound to document content, so stepping back is just editing. Every task names the file it touches, and `cruze check` enforces layer rules. Scenarios are traced to behavioural tests, and the system is actually run. Reviews use a closed rubric with a hard limit of two rounds.

## Quick start

Requires Node.js 22.18 or later, and git.

### 1. Install the CLI

The skills run `cruze` commands, so the agent needs `cruze` on its path. Install it globally, in one of three ways. `cruze --version` confirms which version you have.

From a GitHub Release, without npm. Each release attaches the packed package:

```sh
npm install -g https://github.com/PrintPractical/cruze/releases/download/v0.0.1/printpractical-cruze-0.0.1.tgz
```

From npm, once a version is published there:

```sh
npm install -g @printpractical/cruze
```

From the git repository, at a tag or `#main`. This needs git and access to the repository. npm 11 needs `--install-links` for a global git install, and the first `cruze` command builds the CLI, which takes a moment:

```sh
npm install -g --install-links github:PrintPractical/cruze#v0.0.1
```

### 2. Set up a repository

In the root of the repository:

```sh
cruze init
```

When you didn't install from npm, tell `init` where Cruze came from, so the CI it writes runs the same source instead of the npm package:

```sh
cruze init --package https://github.com/PrintPractical/cruze/releases/download/v0.0.1/printpractical-cruze-0.0.1.tgz
```

`init` asks for the project name, then creates:

| Path | Purpose |
| --- | --- |
| `README.md` | Titled with the project name |
| `CHANGELOG.md` | In [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) format |
| `AGENTS.md` | Agent instructions; Cruze keeps its managed sections current |
| `CLAUDE.md` | One line that imports `AGENTS.md`, for Claude Code |
| `.cruze/config.yaml` | Project configuration |
| `.github/workflows/ci.yml` | CI that runs `cruze validate`, `check` and `trace`; the walking-skeleton change adds the language's build and test steps |
| `.gitattributes` | Merges Cruze's journals line by line, so parallel branches don't conflict on them |
| `.agents/skills/cruze-*` | The Cruze skills, linked into `.claude/skills/` for Claude Code |

Existing files are never overwritten, so it is safe to run in an existing repository.

To upgrade, install the new version globally the same way, then update the skills in each repository:

```sh
cruze install
```

Also update the version in `.github/workflows/ci.yml`.

`install` replaces the Cruze skills (those named `cruze-*`) and leaves your own skills alone. Pass `--agent claude` to link skills for Claude Code in a repository without `CLAUDE.md` or `.claude/`.

The CLI writes JSON to stdout when it isn't attached to a terminal, and a human summary to stderr. Pass `--json` to get JSON on a terminal too.

## Commands

Skills call these at fixed points, and CI runs `check` and `trace` on every push. Run `cruze help` for every option.

| Command | What it does |
| --- | --- |
| `cruze validate` | Checks every document against the formats: IDs, elements, deltas, scope rules, task lines, test plans, roadmap and config |
| `cruze approve <doc>` | Records an approval as a fingerprint: the document's design hash plus the hash of every upstream element it cites. `--replan` sets built elements a rethink changed back to planned; `--rebase` accepts living text a feature must now build on |
| `cruze next` | Names the step to run next on this branch, and why, from computed status |
| `cruze status` | Computes each document's state (approved, edited, upstream changed or unapproved) from content, never from stored state |
| `cruze status --gate build` | Passes only when this branch's change, its feature and the architecture are approved and current |
| `cruze status --overlap` | Lists changes on other branches that touch the same elements as this branch's change |
| `cruze new <kind>` | Creates a project document (`vision`, `glossary`, `architecture`, `roadmap`) or work (`feature`, `change`, `adr`, `note`) from its template, with a dated ID that is never reused |
| `cruze task done <T#>` | Ticks a task with its commit; `cruze task reopen` unticks one a rethink changed, and `cruze task deviation` records a small departure from the plan |
| `cruze features <add\|drop>` | Edits the future list of the feature map |
| `cruze roadmap prune` | Clears landed items from the roadmap's status when a release closes |
| `cruze trace` | Fails when a delivered scenario has no test carrying its ID; `--all` checks every built scenario |
| `cruze check` | Enforces the layer rules and the file budgets; `--ci` also fails on budget warnings |
| `cruze review <role>` | Runs a review role (design reviewer, code reviewer, verifier or researcher) in a fresh agent context, through the command in `.cruze/config.yaml` |
| `cruze land` | Merges a verified change into the living docs, re-stamps the approvals the merge would make stale, fills the Commands and Layout sections of `AGENTS.md`, and archives finished work |
| `cruze abandon <ref>` | Archives a feature or standalone change that stops for good, with its reason, and puts a feature back on the future list |
| `cruze journal add <event>` | Records a rethink, review round, disposition, verification, override or bug; `cruze feedback export` bundles the journal for improving Cruze itself |

Stepping back is editing: change an upstream document and every approval that cites a changed element shows as stale, with the element named. Re-approving is the rewind; there are no phases to reset.

## Skills

`cruze init` and `cruze install` put these into `.agents/skills/`. Agents load them when a situation calls for them, and the workflow skills will load them by path at the step that needs them.

| Skill | What it holds |
| --- | --- |
| `cruze-explore` | Optional thinking partner before any step: options and trade-offs, captured as a note only when you ask |
| `cruze-envision` | The what: the project's vision, goals and feature map, or one feature's intent and requirements with scenarios |
| `cruze-architect` | The how: the architecture, a feature's architecture delta and its changes, or a tweak; ends with a design review and a walkthrough for your approval |
| `cruze-roadmap` | Orders the release into phases with blocking edges and goal coverage, and closes a release |
| `cruze-plan` | Turns a change into a test plan and ordered tasks with file targets, reviewed in a fresh context |
| `cruze-build` | Builds the change task by task, each test-first, checked and committed, and stops to rethink when the design is wrong |
| `cruze-verify` | Runs the checks, a fresh-context verifier that uses the real system, a two-lane code review and a manual test script, then asks you to accept |
| `cruze-land` | Merges the change into the living docs and updates the changelog, README and `AGENTS.md`; also lands bug fixes |
| `cruze-triage` | Reproduces a bug, finds its root cause against the living docs, and fixes it test-first or routes it to architect or rethink |
| `cruze-rethink` | Steps back to the level a discovery touches, keeps completed work, re-approves what went stale and records why |
| `cruze-next` | Says which step to run next and why |
| `cruze-roles` | The fresh-context design reviewer, code reviewer, verifier and researcher, and how a review runs to a disposition for every finding |
| `cruze-formats` | The format of every Cruze document, with templates |
| `cruze-hexagonal-design` | Ports and adapters with domain-driven design: who owns each rule, dependency direction, many small modules, contracts, runtime ownership, and notes for Rust and C++ |
| `cruze-behavioural-testing` | Which tests to write and at which seam, fakes instead of mocks, and protecting approved scenarios' tests |
| `cruze-grilling` | Interviewing the user in rounds until decisions settle, and challenging once before deferring |
| `cruze-domain-language` | Building the glossary and using its words in documents, IDs and code |
| `cruze-dependency-approval` | No new dependency without your explicit approval, and where approvals are recorded |
| `cruze-research` | Adopting a mature library before building, and answering questions from primary sources at the right version |

## Reporting back

Cruze improves from what goes wrong in real projects. Every rethink, review finding, bug and override is recorded in the project's journal. To send them back:

```sh
cruze feedback export --out cruze-feedback.json
```

The export replaces the project name, and the name of whoever approved or recorded each entry, with placeholders. Read it before sharing: summaries can still mention your domain or people. Attach it to an issue at https://github.com/PrintPractical/cruze/issues. Maintainers turn it into changes with the `cruze-retro` skill in this repository.

## Development

```sh
npm ci
npm run check          # typecheck, test and build
node src/main.ts help  # run the CLI from source
```

See [AGENTS.md](AGENTS.md) for the code layout and conventions, [docs/contributing/writing-skills.md](docs/contributing/writing-skills.md) for how skills are written, and [RELEASING.md](RELEASING.md) for publishing.

## License

[Apache 2.0](LICENSE)
