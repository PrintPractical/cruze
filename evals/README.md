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

Fixture projects and graded runs arrive with the workflow skills, and are written from real runs in the dogfooding phase.
