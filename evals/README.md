# Evals

Checks that Cruze's skills work when an agent runs them. They are not shipped in the npm package.

## Load check

A workflow skill names the knowledge files it needs by installed path, such as `.agents/skills/cruze-hexagonal-design/SKILL.md`. The load check confirms that a run actually loaded each one.

1. Run the workflow skill on the fixture project in Claude Code.
2. Find the session transcript under `~/.claude/projects/<project>/<session>.jsonl`, and its subagent transcripts under `<session>/subagents/`.
3. Run the check:

   ```sh
   node evals/load_check.ts skills/architect ~/.claude/projects/<project>/<session>.jsonl ~/.claude/projects/<project>/<session>/subagents/*.jsonl
   ```

It prints the named files and the ones never loaded, and exits 1 when any is missing. A file counts as loaded when the agent read it, printed it from a shell command, or invoked its skill (for a `SKILL.md`). Only Claude Code transcripts are understood so far; other agents follow in V1.1.

## Graded runs

An eval case in `cases/` with a `## Run` section (format in `.agents/skills/cruze-retro/eval-cases.md`) runs headlessly and is graded. For each case, the runner copies the fixture project into a temporary directory and commits it, installs the skills from source there with a `cruze` shim that runs `src/main.ts`, runs the case's setup commands and commits again, then gives the prompt to the agent (`claude -p`, with the case's tools and `--permission-mode acceptEdits`). A second headless run grades the result against the case's `## Expected` and `## Check`, from the agent's output, the copy's `git status` and `git diff`, and its journal (`cruze journal list --all --json`), and ends with `VERDICT: pass` or `VERDICT: fail: <reason>`.

One case:

```sh
node evals/run.ts evals/cases/2026-09-28-plan-lists-callers.md
```

All cases:

```sh
node evals/run.ts
```

Options: `--agent <command>` (default `claude`; it must take `-p <prompt>`), `--fixture <dir>` (default `examples/console-access`), `--out <report.json>` to write the report to a file as well, and `--keep` to keep every temporary copy.

The report is JSON on stdout: one entry per case with its `status` (`pass`, `fail`, `manual` or `error`), the grader's `reason` for a fail or what went wrong for an error, and the `workdir` of a kept copy, plus the counts. It exits 1 when a case failed or errored. A failed or errored case's copy is kept at `workdir` for inspection; a passed one's is deleted unless `--keep`. A case without `## Run` is reported as `manual` and counts against nothing.

Each case costs one or two headless agent runs: the agent's, then the grader's when the agent's run succeeded. An agent run is limited to 30 minutes and the grader to 10. Run one case while writing it, and the whole set before a release.
