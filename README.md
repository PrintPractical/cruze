# Cruze

Cruze is a spec-driven development framework for coding agents. It keeps one living model of your system (vision, glossary, architecture and behaviour specs) and delivers work as small changes against that model. Each change is merged back into the model when it lands, so the architecture an agent reads on the tenth change is as current as it was on the first.

It works with any agent that supports the [Agent Skills](https://agentskills.io) format. It ships as one npm package: a `cruze` CLI that owns every deterministic step (IDs, approvals, checks, merges) and a set of skills that guide the agent through design and delivery.

## Status

Early development. Version 0.1 contains only repository setup: `cruze init` and `cruze install`. The design and delivery skills arrive in later releases. Claude Code is the agent tested so far.

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

## Development

```sh
npm ci
npm run check          # typecheck, test and build
node src/main.ts help  # run the CLI from source
```

See [AGENTS.md](AGENTS.md) for the code layout and conventions, [docs/contributing/writing-skills.md](docs/contributing/writing-skills.md) for how skills are written, and [RELEASING.md](RELEASING.md) for publishing.

## License

[Apache 2.0](LICENSE)
