# Configuration format

`.cruze/config.yaml` configures the CLI for one project. `cruze init` creates it. Project-scope architect fills in `source`, `tests` and `layers` from the module map.

```yaml
version: 1
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
| `project` | The project name, quoted. |
| `tracker` | Where work items live. `markdown` is the only value in V1. |
| `source` | Globs of the source files `cruze check` inspects. |
| `tests` | Globs of the files `cruze trace` searches for scenario IDs. |
| `check.max_lines` | Line budget per source file. |
| `check.max_types` | Budget of top-level types per source file. |
| `check.exceptions` | Files allowed past a budget, each with a `path` and a `reason`. |
| `layers` | Each layer has a `name`, the `paths` it covers, and `may_import`, the layers it may depend on. |
| `commands` | The project's commands by name, such as `test` or `run`. The walking-skeleton change fills them in, and `cruze land` copies them into the Commands section of `AGENTS.md`. |
| `review.command` | The program and arguments `cruze review` runs to start an agent in a fresh context, with the prompt on standard input. The default runs Claude Code in print mode, allowed to read the project and run `git diff`, `git log`, `git show` and `cruze`. The verifier runs the system, so add the project's build and run commands. |

Rules for layers:

- A source file belongs to the first layer whose paths match it. A file in no layer may import anything, so every source file should be in a layer.
- Imports of code outside the project, such as the standard library and dependencies, are always allowed. Adapter layers are where they belong, and review checks that.
- A layer may import itself. Every other dependency is listed in `may_import`, and together they follow the `RULE` elements in the architecture.
- Each `MOD` element's `Path` falls in exactly one layer, and the layer's `may_import` fits the module's `Layer`. A domain layer imports only domain layers, and nothing outside composition imports adapter layers.
