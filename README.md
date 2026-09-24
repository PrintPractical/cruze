# Cruze

Cruze is a spec-driven development framework for coding agents. It keeps one living model of your system (vision, glossary, architecture and behaviour specs) and delivers work as small changes against that model. Each change is merged back into the model when it lands, so the architecture an agent reads on the tenth change is as current as it was on the first.

It works with any agent that supports the [Agent Skills](https://agentskills.io) format. It ships as one npm package: a `cruze` CLI that owns every deterministic step (IDs, approvals, checks, merges) and a set of skills that guide the agent through design and delivery.

## Status

Early development. The CLI is complete for the V1 lifecycle. The document formats ship as the `cruze-formats` skill, and the standards an agent designs and codes to ship as knowledge skills (below). The workflow skills that guide an agent through design and delivery arrive in later releases. Claude Code is the agent tested so far.

## Why

Spec-driven workflows tend to fail in the same few ways:

- The architecture drifts after a few changes, because design decisions die with the change that made them.
- Stepping back to fix a design mid-implementation breaks the workflow's state.
- Code lands in a handful of oversized files, because nothing owns module structure before code is written.
- Everything is "fully specified", yet the result fails when a person actually uses it.
- Review loops keep finding new things to change and never converge.

Cruze answers each of these with a specific mechanism. A living `docs/architecture.md` is read at every step and updated by every change. Approvals are bound to document content, so stepping back is just editing. Every task names the file it touches, and `cruze check` enforces layer rules. Scenarios are traced to behavioural tests, and the system is actually run. Reviews use a closed rubric with a hard limit of two rounds.

## Quick start

Requires Node.js 22.18 or later. In the root of a repository:

```sh
npx @printpractical/cruze init
```

This asks for the project name, then creates:

| Path | Purpose |
| --- | --- |
| `README.md` | Titled with the project name |
| `CHANGELOG.md` | In [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) format |
| `AGENTS.md` | Agent instructions; Cruze keeps its managed sections current |
| `CLAUDE.md` | One line that imports `AGENTS.md`, for Claude Code |
| `.cruze/config.yaml` | Project configuration |
| `.github/workflows/ci.yml` | A CI stub that later changes make real |
| `.agents/skills/cruze-*` | The Cruze skills, linked into `.claude/skills/` for Claude Code |

Existing files are never overwritten, so it is safe to run in an existing repository.

After upgrading the package, update the skills:

```sh
npx @printpractical/cruze install
```

`install` replaces the Cruze skills (those named `cruze-*`) and leaves your own skills alone. Pass `--agent claude` to link skills for Claude Code in a repository without `CLAUDE.md` or `.claude/`.

The CLI writes JSON to stdout when it isn't attached to a terminal, and a human summary to stderr. Pass `--json` to get JSON on a terminal too.

## Commands

Skills call these at fixed points, and CI runs `check` and `trace` on every push. Run `cruze help` for every option.

| Command | What it does |
| --- | --- |
| `cruze validate` | Checks every document against the formats: IDs, elements, deltas, scope rules, task lines, test plans, roadmap and config |
| `cruze approve <doc>` | Records an approval as a fingerprint: the document's design hash plus the hash of every upstream element it cites |
| `cruze status` | Computes each document's state (approved, edited, upstream changed or unapproved) from content, never from stored state |
| `cruze status --gate build` | Passes only when this branch's change, its feature and the architecture are approved and current |
| `cruze status --overlap` | Lists changes on other branches that touch the same elements as this branch's change |
| `cruze new <feature\|change\|adr>` | Creates work from its template, with a dated ID that is never reused |
| `cruze task done <T#>` | Ticks a task with its commit; `cruze task deviation` records a small departure from the plan |
| `cruze features <add\|drop>` | Edits the future list of the feature map |
| `cruze trace` | Fails when a delivered scenario has no test carrying its ID; `--all` checks every built scenario |
| `cruze check` | Enforces the layer rules and the file budgets; `--ci` also fails on budget warnings |
| `cruze land` | Merges a finished change into the living docs, re-stamps the approvals the merge would make stale, and archives finished work |
| `cruze journal add <event>` | Records a rethink, review round, disposition, override or bug; `cruze feedback export` bundles the journal for improving Cruze itself |

Stepping back is editing: change an upstream document and every approval that cites a changed element shows as stale, with the element named. Re-approving is the rewind; there are no phases to reset.

## Skills

`cruze init` and `cruze install` put these into `.agents/skills/`. Agents load them when a situation calls for them, and the workflow skills will load them by path at the step that needs them.

| Skill | What it holds |
| --- | --- |
| `cruze-formats` | The format of every Cruze document, with templates |
| `cruze-hexagonal-design` | Ports and adapters with domain-driven design: who owns each rule, dependency direction, many small modules, contracts, runtime ownership, and notes for Rust and C++ |
| `cruze-behavioural-testing` | Which tests to write and at which seam, fakes instead of mocks, and protecting approved scenarios' tests |
| `cruze-grilling` | Interviewing the user in rounds until decisions settle, and challenging once before deferring |
| `cruze-domain-language` | Building the glossary and using its words in documents, IDs and code |
| `cruze-dependency-approval` | No new dependency without your explicit approval, and where approvals are recorded |
| `cruze-research` | Adopting a mature library before building, and answering questions from primary sources at the right version |

## Development

```sh
npm ci
npm run check          # typecheck, test and build
node src/main.ts help  # run the CLI from source
```

See [AGENTS.md](AGENTS.md) for the code layout and conventions, [docs/contributing/writing-skills.md](docs/contributing/writing-skills.md) for how skills are written, and [RELEASING.md](RELEASING.md) for publishing.

## License

[Apache 2.0](LICENSE)
