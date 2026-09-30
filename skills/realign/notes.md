# Realign notes

Each release that changes what Cruze expects of a project ships a notes file, `notes/<version>.md`. `cruze realign status` reads the notes between the project's `standards:` and the installed version.

## Releases

- [0.0.2](notes/0.0.2.md)
- [0.0.3](notes/0.0.3.md)
- [0.0.4](notes/0.0.4.md)

## Format

A note is a `###` heading with an ID and a title, then facts:

```markdown
### test-placement: Rust tests live in tests/
- Applies to: existing code
- Rule: `.agents/skills/cruze-hexagonal-design/languages/rust.md`, "Dependencies and tooling"
- Detect: check:test-placement
- Migrate: move `src/<module>/tests.rs` to `tests/<module>.rs`
```

| Fact | Holds |
| --- | --- |
| `Applies to` | `existing code`, when work that met the last release must change; `new work only`, when only future work follows it |
| `Rule` | The skill file and heading that state the rule |
| `Detect` | The CLI rule that finds it, as `check:<rule>` or `validate:<rule>` |
| `Ask` | The question the auditor answers when no CLI rule can |
| `Migrate` | How existing work changes to meet it |

A note for existing code has `Migrate`, and `Detect` or `Ask`.
