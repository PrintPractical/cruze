---
name: cruze-roles
description: Prompts for Cruze's fresh-context roles, the code reviewer and the researcher, and how to run one. Use when a Cruze step says to run a review or research in a fresh context.
---

# Roles

A role is a prompt with fixed inputs and a report as its only output. It runs in a fresh context, so it judges the work rather than the conversation that produced it. It never edits files.

| Role | File | Used by |
| --- | --- | --- |
| Code reviewer | [code-reviewer.md](code-reviewer.md) | review and fix |
| Researcher | [researcher.md](researcher.md) | envision, for technology choices; any step with a question that needs evidence |

## Running a role

1. **Start a fresh context:** a helper agent with no conversation history, where the agent can start one. Give it the role file's full text, the feature slug and the base commit, and nothing else: your opinions and your reasons for the code stay out.
2. **Or let the CLI start one:** `cruze review <role> --feature <slug> --base <commit>`, where the role is `code-reviewer` or `researcher`. It runs the agent configured under `review:` in `.cruze/config.yaml` and prints the role's report. When no agent is configured, or it isn't installed, it prints `status: run-in-helper` with the full prompt instead: give exactly that prompt to a helper.
3. **When no fresh context can run,** the code reviewer must still run fresh: tell the user, and have them run the prompt in a new session. The researcher may run in your own context, since its evidence is checkable; say that you did.
4. **Take the report** as it comes back, and check each finding's evidence against the files before you act on it.
