# Configuration format

`.cruze/config.yaml` configures the CLI for one project. `cruze init` creates it. Project-scope architect fills in `source`, `tests` and `layers` from the module map.

```yaml
version: 1
cruze: "0.0.2"
standards: "0.0.2"
project: "Console Access"
tracker: markdown

source: ["src/**/*.rs"]
tests: ["src/**/*.rs", "tests/**/*.rs"]

check:
  max_lines: 250
  max_types: 5
  exceptions:
    - path: src/cli/args.rs
      reason: the clap derive struct lists every flag in one place

commands:
  format: cargo fmt --check
  lint: cargo clippy -- -D warnings
  test: cargo test
  run: cargo run -- list

review:
  command: ["claude", "-p", "--allowedTools", "Read Grep Glob Bash(git diff:*) Bash(git log:*) Bash(git show:*) Bash(cruze:*) Bash(cargo:*)"]
  decide: exceptions

changes:
  min_builds: 3
  max_scenarios: 30
  max_tasks: 25

layers:
  - name: inventory-domain
    paths: ["src/inventory/domain/**"]
    may_import: []
  - name: inventory-app
    paths: ["src/inventory/app/**"]
    may_import: [inventory-domain]
```

| Key | Meaning |
| --- | --- |
| `version` | Format version. Always `1` for now. |
| `cruze` | The Cruze version whose skills the project installed. `cruze install` writes it; don't edit it, except to go back to an older version on purpose. |
| `standards` | The Cruze version whose expectations the code meets. `cruze realign done` moves it up. A rule a later release added reports but fails no CI until then. Without it, a project meets `0.0.1`. |
| `project` | The project name, quoted. |
| `tracker` | Where work items live. `markdown` is the only value in V1. |
| `source` | Globs of the source files `cruze check` inspects. |
| `tests` | Globs of the files `cruze trace` searches for scenario IDs. |
| `check.max_lines` | Line budget per source file. Test files outside `source` have no budget. |
| `check.max_types` | Budget of top-level types per source file. |
| `check.exceptions` | Files allowed past a budget, or Rust test files allowed under `src/` (`test-placement`), each with a `path` and a `reason`. `realign` adds entries whose reason ends `scheduled in <ref>`, and landing that change removes them. |
| `layers` | Each layer has a `name`, the `paths` it covers, and `may_import`, the layers it may depend on. |
| `commands` | The project's commands by name, such as `test` or `run`. The walking-skeleton change fills them in, and `cruze land` copies them into the Commands section of `AGENTS.md`. When the suite has a slow tier, such as UI, device or end-to-end tests, `test` runs only the fast tier and `test_full` runs everything. The full suite is `test_full` when it is set, and `test` otherwise. |
| `review.command` | The program and arguments `cruze review` runs to start an agent in a fresh context, with the prompt on standard input. Optional. `cruze init` sets it for Claude Code to run in print mode, allowed to read the project and run `git diff`, `git log`, `git show` and `cruze`. The verifier runs the system, so add the project's build and run commands. When it is unset, or its program isn't installed, `cruze review` hands the role's prompt back to the calling agent to run in a helper. |
| `review.decide` | Which review findings the user decides. `exceptions`, the default: only findings whose fix changes behaviour, a designed port or contract, or another decision the user owns, and any the agent wouldn't simply fix as proposed. The agent fixes the rest and lists them. `all`: the user decides every finding. |
| `changes.min_builds` | A feature's change that builds fewer elements than this gets a `change-too-small` warning: merge it into the change it continues. Default `3`. |
| `changes.max_scenarios` | A change that delivers more scenarios than this gets a `change-too-large` warning: split it. Default `30`. |
| `changes.max_tasks` | A plan with more tasks than this gets a `plan-too-large` warning. Default `25`. |

Rules for layers:

- A source file belongs to the first layer whose paths match it. A file in no layer may import anything, so every source file should be in a layer.
- Imports of code outside the project, such as the standard library and dependencies, are always allowed. Adapter layers are where they belong, and review checks that.
- A layer may import itself. Every other dependency is listed in `may_import`, and together they follow the `RULE` elements in the architecture.
- Each `MOD` element's `Path` falls in exactly one layer, and the layer's `may_import` fits the module's `Layer`. A domain layer imports only domain layers, and nothing outside composition imports adapter layers.
