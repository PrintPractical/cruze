# Writing Cruze skills

Cruze skills are read by agents, not people. Write them for the agent that reads them cold, midway through a task, with no memory of this project's history. The same process should happen every run, even though the output differs.

`test/bundle.test.ts` enforces the format rules in the first section. The rest is the house style that reviews check.

## Format

- A skill is a folder under `skills/` with a `SKILL.md`. It is installed as `cruze-<folder>`, and the frontmatter `name` must be exactly that. The `name` is lowercase letters, digits and single hyphens, at most 64 characters.
- The frontmatter holds `name` and `description` as flat `key: value` lines. The description is at most 1024 characters.
- The body of `SKILL.md` is at most 150 lines. Templates, checklists, rubrics and examples go in sibling files, each reached by a pointer line that says when to read it.
- Point to a sibling file with a relative Markdown link, such as `[contracts.md](contracts.md)`. Point to another Cruze skill's file by its installed path in backticks, such as `.agents/skills/cruze-formats/reference/work-items.md`, because that is where the agent finds it in a project. Every pointer must resolve, and every Markdown file in a skill must be reachable by links from its `SKILL.md`.

## Two kinds of skill

- **Workflow skills** are the commands a person runs: `explore`, `envision`, `architect`, `plan`, `build`, `verify`, `land`, `triage`, `rethink`, `next`. The description is one plain sentence saying what the command does. Each one ends by naming the next step, taken from `cruze status`.
- **Knowledge skills** hold standards: `hexagonal-design`, `behavioural-testing`, `grilling`, `domain-language`, `dependency-approval` and `research`. The description says what the skill covers and lists the situations that should load it, one trigger per distinct situation. Workflow skills also load them explicitly, by installed path, at the step that needs them, so nothing depends on a trigger firing. A knowledge skill opens with the procedure an agent follows when it applies the standard, then the rules, and puts material only some runs need (a language, runtime concerns, worked examples) in sibling files.

## Agent neutrality

Skills run under Claude Code, Codex, OpenCode and others. Name the action, never an agent's tool: write "read `docs/architecture.md`", "run `cruze check --file <path>`" or "ask the user", not the name of a specific agent's read, shell or question tool. When a step needs a fresh-context reviewer, point to the role file in `roles/` and to `cruze review`, which starts one under any agent.

## Structure

- **Steps first.** Put the ordered actions the agent performs at the top. Put reference material (rules, formats, definitions) below them or in sibling files.
- **Every step ends on a completion criterion** the agent can check: "every `SCN` in the change has a test naming it", not "the tests are adequate". Make criteria exhaustive where thoroughness matters.
- **Deterministic work goes to the CLI.** When a step needs an ID, a hash, an approval, a check or a merge, the skill runs the `cruze` command and uses its JSON output. Where the output proves the step was done, the skill has the agent quote it.
- **Disclose by branch.** Keep inline what every run needs. Move what only some runs need (a scope, a language, an edge case) behind a pointer to a sibling file.
- **Keep related material together.** A concept's rule, reason and exception sit under one heading.

## Wording

- **State the target behaviour.** "Write one test per scenario, named with its `SCN` ID." A prohibition earns a line only as a hard guardrail, and even then it sits next to the positive target.
- **Use leading words** the model already knows: *walking skeleton*, *tracer bullet*, *seam*, *port*, *adapter*, *red/green*, *blocker*. Use the same word everywhere for the same idea.
- **Cut no-ops.** Delete any sentence that doesn't change what the agent would do by default, such as "be careful" or "write clean code".
- **Keep one source of truth.** A rule lives in one skill or one reference file, and other skills point to it. Don't restate what the agent can look up in one step (`package.json` scripts, `--help`, the directory tree). Write down what can't be looked up: the reason, the convention, the gotcha.
- **Write plainly.** Use short sentences and specific nouns. No emoji and no marketing adjectives.

## House conventions

- **Materiality boundary.** The agent decides local, reversible choices on its own. It asks the user about public contracts, architecture, dependencies and costly commitments.
- **Challenge, then defer.** When the user steers toward something that breaks a principle, an ADR or a knowledge skill, the agent names the rule, the concrete risk and a recommended alternative, once. The user decides. The skill records the override so it is never raised again.

## Testing a skill

- **Load test.** Run the workflow skill on the fixture project, then run `node evals/load_check.ts skills/<folder> <transcript.jsonl> [subagent transcripts...]`. It lists every knowledge file the skill names by installed path that the run never loaded, and fails when there is one. See [evals/README.md](../../evals/README.md).
- **Fixture run.** The skill's completion criteria hold on the fixture, and the `cruze` commands it calls leave the expected `.cruze/` state.
- **Evals.** A change to a skill, role or template reruns the evals in `evals/` once they exist.
