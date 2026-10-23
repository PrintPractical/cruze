# Cruze

<p align="center">
  <img src="docs/assets/cruze-logo.jpg" alt="Cruze" width="720">
</p>

Cruze is a lightweight spec-driven workflow for coding agents. You and the agent put the product's vision and future features on paper, break the release into features, and agree on an architecture map. Then, one feature at a time, you agree on what it does and what its public API looks like, and the agent builds it test-first with ports and adapters, reviews it in a fresh context, and opens a pull request.

It works with any agent that supports the [Agent Skills](https://agentskills.io) format. It ships as one npm package: a small `cruze` CLI for the deterministic parts (approvals, the next step, scenario-to-test tracing, layer rules) and a set of skills that guide the agent.

## Status

Version 0.0.14 was a rewrite. The earlier previews ran thirteen steps with design reviews, plans, verifiers, journals and merged living specs. Measured across nine projects, they took about twice the time of a plain design doc and plan for code of the same quality, and asked the user so many questions that most answers were a bare "agree". It kept what paid off and dropped the rest. Nothing is compatible with 0.0.13 projects. Claude Code is the agent tested so far.

## The flow

```
envision ──► shape ──► build ──► review ──► pull request
(project start, next release, or a change of direction)

brainstorm: talk it through ──► settled list ──► shape, envision or refactor writes it
fix:        reproduce ──► failing test ──► fix ──► review ──► pull request
refactor:   map the change ──► small green steps ──► review ──► pull request
align:      review the documents in parallel ──► fix form and drift ──► pull request
```

| Step | Who | What comes out | Your part |
| --- | --- | --- | --- |
| `envision` | you and the agent | `docs/vision.md`: the problem, users, the release's features and what each needs, future features and what must stay possible. `docs/architecture.md`: ports, adapters, runtime, technology, layers | Answer one round of questions, approve both documents |
| `brainstorm` | you and the agent | A list of what you settled together, handed to the step that writes it | Talk it through for as many rounds as you want; confirm the list |
| `shape` | you and the agent | `docs/features/<slug>.md`: behaviour as scenarios, the public API as code, a sketch of how it crosses the stack, the decisions the agent took, after research into what the code already has and a fresh-context review that runs while you read | Approve it, or say what to change; agree when a shared piece it needs should be a feature of its own, built first, or when the work changes features already built, which shape edits in place for build to take again |
| `build` | the agent | Code built test-first, one scenario at a time; the first feature also sets up CI with a coverage gate | At the end, approve the scenarios it corrected for a fact, each shown before and after; it stops sooner only when what a scenario is for, or the public API, has to change |
| `review` | a fresh-context reviewer | Fixes for what it finds, a note on how to try the feature, a pull request | Decide only findings that would change what you approved |
| `fix` | the agent | A failing test that reproduces the bug, the fix, a review, a pull request | Nothing, unless the right behaviour is your call |
| `refactor` | the agent | The code restructured in small steps with every test green and none weakened, a review, a pull request | Nothing, unless the architecture or a public API you approved changes; then you see it before and after and approve |
| `align` | the agent | Every document, or the ones you name, brought up to the current format and conventions and up to date with the code, after upgrading Cruze or whenever you want | Approve the changes in meaning, each shown before and after |

### Which step to run

| You want to… | Run |
| --- | --- |
| Start a project from an idea | `envision` |
| Plan the next release, once this one is built | `envision` |
| Change direction: new users, a new major capability, something dropped, a non-goal changed | `envision` |
| Work out a design together before anything is written, or you aren't sure which step fits | `brainstorm` |
| Design the next feature of the release | `shape` |
| Design a feature you came up with that the vision doesn't list yet | `shape`; it adds the feature to the release, or sends you to `envision` when the idea is several features or a new direction |
| Change what built features do or look like from outside | `shape`; it edits those features in place, and `build` builds the change |
| Build a feature you approved | `build` |
| Review a built feature and open its pull request | `review` |
| Fix a bug, from you or an issue | `fix` |
| Restructure code without changing what it does | `refactor` |
| Bring documents up to date, after upgrading Cruze or as the code moved on | `align` |
| Find out what comes next | `cruze next` |

In Claude Code, run a step as a slash command, such as `/cruze-shape export-csv` or `/cruze-brainstorm`. With other agents, ask for it by name, such as "shape export-csv". When you'd rather talk a question through than answer it, say so at any step, and the agent brainstorms with you before carrying on.

What it holds to:

- **You decide behaviour and public APIs; the agent decides the rest.** The agent asks at most one round of questions per step, unless you choose to brainstorm, and lists the choices it made in the document you approve, so nothing about the stack surprises you at the end.
- **The architecture is designed for what's coming.** Future features shape the boundaries, such as where a port goes, but nothing is built for them until they join a release.
- **Ports and adapters.** `cruze check` enforces the layer rules in CI.
- **Behavioural tests.** Every scenario has a test carrying its ID, and `cruze trace` fails CI when one is missing.
- **Approvals follow the text.** An approved feature edited later shows as edited until you approve it again.

## Quick start

Requires Node.js 22.18 or later, and git.

### 1. Install the CLI

The skills run `cruze` commands, so the agent needs `cruze` on its path. Install it globally, in one of three ways. `cruze --version` confirms which version you have.

From a GitHub Release, without npm:

```sh
npm install -g https://github.com/PrintPractical/cruze/releases/download/v0.0.18/printpractical-cruze-0.0.18.tgz
```

From npm, once a version is published there:

```sh
npm install -g @printpractical/cruze
```

From the git repository, at a tag or `#main`. npm 11 needs `--install-links` for a global git install, and the first `cruze` command builds the CLI:

```sh
npm install -g --install-links github:PrintPractical/cruze#v0.0.18
```

### 2. Set up a repository

In the root of the repository:

```sh
cruze init
```

When you didn't install from npm, tell `init` where Cruze came from, so the CI it writes runs the same source:

```sh
cruze init --package https://github.com/PrintPractical/cruze/releases/download/v0.0.18/printpractical-cruze-0.0.18.tgz
```

`init` asks for the project name and your coding agent: `claude` for Claude Code, or `other` for any agent that reads `AGENTS.md` and `.agents/skills/`. It creates `README.md`, `CHANGELOG.md`, `AGENTS.md` (and `CLAUDE.md` for Claude Code), `.cruze/config.yaml`, a CI workflow that runs `cruze validate`, `check` and `trace`, and the skills in `.agents/skills/`, linked into `.claude/skills/` for Claude Code. It never overwrites an existing file.

### 3. Start

Ask your agent to envision the project, and give it whatever you have: a sentence, a design document, a conversation. From then on, `cruze next` says what comes next.

## Upgrading

1. Upgrade the CLI the same way you installed it, naming the new version.
2. In each repository, run `cruze install`. It replaces the Cruze skills (those named `cruze-*`) and leaves your own alone, records the version in `.cruze/config.yaml`, and moves the CI workflow to the new version when CI runs a published package, a release tarball or a release tag.
3. Commit the skills, the config and the CI workflow together.

When the CLI you run differs from the version the project records, every command notes it on stderr, and `cruze validate` warns.

## Commands

| Command | What it does |
| --- | --- |
| `cruze init` | Sets up the repository and installs the skills |
| `cruze install` | Installs or updates the skills |
| `cruze new vision\|architecture\|feature <slug>` | Starts a document from its template |
| `cruze validate` | Checks the documents: required sections, scenario IDs, the release's features and needs, leftover template text |
| `cruze approve <vision\|architecture\|slug>` | Records that you approved a document as it reads now |
| `cruze status` | Each document's approval and each feature's progress, in release order, and the next step |
| `cruze next` | The step to run next, and why |
| `cruze trace [<slug>]` | Fails when a built feature's scenario has no test carrying its ID, or a test names a scenario no feature defines |
| `cruze check [<file>...] [--ci]` | Enforces the layer rules, and warns on file budgets (fails on them with `--ci`) |
| `cruze review <code-reviewer\|doc-reviewer\|researcher> [--feature <slug>] [--base <commit>]` | Runs a role in a fresh agent context, through the command in `.cruze/config.yaml` |

Every command prints JSON when stdout isn't a terminal, and text on a terminal; `--json` and `--text` choose. Errors and notes go to stderr.

## Skills

| Skill | What it holds |
| --- | --- |
| `cruze-envision` | The vision with future features, the release broken into features with their needs, and the architecture map |
| `cruze-brainstorm` | Working out a design with you, round by round, before anything is written |
| `cruze-shape` | One feature's behaviour, public API and stack sketch, or a change to features already built, reviewed in a fresh context and approved by you |
| `cruze-build` | Building an approved feature test-first, scenario by scenario, and the foundation's CI |
| `cruze-review` | The fresh-context code review, fixes, and the pull request |
| `cruze-fix` | A bug from report to reviewed fix |
| `cruze-refactor` | Restructuring code without changing what it does |
| `cruze-align` | Bringing the documents up to the current format and conventions, and up to date with the code |
| `cruze-asking` | When to ask you and when to decide, and how to show a question with code and diagrams |
| `cruze-formats` | The format of each document, with templates |
| `cruze-hexagonal-design` | Ports and adapters with domain-driven design, contracts, runtime ownership, layouts by kind of system, and notes for Rust, Swift and C++ |
| `cruze-behavioural-testing` | Which tests to write and at which seam, and fakes instead of mocks |
| `cruze-dependency-approval` | Adopt libraries freely; ask only for significant ones |
| `cruze-research` | Adopting a mature library before building, and answering questions from primary sources |
| `cruze-roles` | The fresh-context code reviewer, document reviewer and researcher, and how to run them |

## Development

```sh
npm ci
npm run check          # typecheck, test and build
node src/main.ts help  # run the CLI from source
```

See [AGENTS.md](AGENTS.md) for the code layout and conventions, [docs/contributing/writing-skills.md](docs/contributing/writing-skills.md) for how skills are written, and [RELEASING.md](RELEASING.md) for publishing.

## License

[Apache 2.0](LICENSE)
