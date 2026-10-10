# One session carried plan, build, verify and land

- Proposal: every workflow skill's next step, `cruze next` and the `AGENTS.md` template say the next step runs in a new session.
- Evidence: Claude Code transcripts of the rto and ork projects on Cruze 0.0.7 (2026-10-01 to 2026-10-10). Of 37 rto sessions, 26 ran plan, build, verify and land in one context; peak context 745k tokens, median per turn 312k, one compaction. Ork: 33 sessions, median 306k, peak 682k.
- Asset: `skills/*/SKILL.md` (Next step), `src/adapters/inbound/cli/commands/status.ts` (`runNext`), `templates/init/AGENTS.md`

## Situation

On the console-access fixture, the agent finishes `plan` for `01-local-serial`, and the user asks what comes next.

## Expected

The agent names `build` on the branch and says to start it in a new session. `cruze next --text` ends with "Run it in a new session, so its context starts empty."

## Check

A test: `test/cli.test.ts`, "validates, approves and reports status on a copy of the worked example", asserts the line in `cruze next`. Fixture run: headless `plan` through its last step; the final message names a new session.
