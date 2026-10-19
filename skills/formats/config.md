# Configuration format

`.cruze/config.yaml` configures the CLI for one project. `cruze init` creates it, and the foundation feature fills in `source`, `tests` and `layers` from `docs/architecture.md`.

```yaml
version: 2
cruze: "0.0.15"
project: "Console Access"

source: ["src/**/*.rs"]
tests: ["src/**/*.rs", "tests/**/*.rs"]

check:
  max_lines: 600
  max_types: 12
  exceptions:
    - path: src/cli/args.rs
      reason: the clap derive struct lists every flag in one place

layers:
  - name: domain
    paths: ["src/domain/**"]
    may_import: []
  - name: app
    paths: ["src/app/**"]
    may_import: [domain]
  - name: adapters
    paths: ["src/adapters/**"]
    may_import: [app, domain]

review:
  command: ["claude", "-p", "--allowedTools", "Read Grep Glob Bash(git diff:*) Bash(git log:*) Bash(git show:*) Bash(cruze:*) Bash(cargo test:*)"]
```

| Key | Meaning |
| --- | --- |
| `version` | Format version, `2`. |
| `cruze` | The Cruze version whose skills the project installed. `cruze install` writes it. |
| `project` | The project name, quoted. |
| `source` | Globs of the source files `cruze check` inspects. |
| `tests` | Globs of the files `cruze trace` searches for scenario IDs. |
| `check.max_lines`, `check.max_types` | Budgets per source file, lines and top-level types, that `cruze check` warns past: a backstop against a file that has outgrown one responsibility, never a size to design to. A Rust file's `#[cfg(test)]` modules don't count. |
| `check.exceptions` | Files allowed past a budget, each with a `path` and a `reason`. |
| `layers` | Each layer has a `name`, the `paths` it covers, and `may_import`, the layers it may depend on. |
| `review.command` | The program and arguments `cruze review` runs to start an agent in a fresh context, with the prompt on standard input. Without it, `cruze review` hands the prompt back for the calling agent to run in a helper of its own. |

A source file belongs to the first layer whose paths match it, and `cruze check` fails an import into a layer its own layer may not import. In a Cargo workspace it follows `use other_crate::…` into that crate, named by its directory. A layer may import itself, and code outside the project, such as the standard library and dependencies, is always allowed. Keep every source file in a layer: `cruze check` warns on one that isn't.
