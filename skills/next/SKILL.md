---
name: cruze-next
description: Says which Cruze step to run next and why, from the project's computed status and the current branch.
---

# Next

Next reads the project's state and says what to do now. The CLI works it out from content, so the answer is the same for every agent and every run.

## Steps

1. **Ask the CLI.** Run `cruze next` and read its JSON: the step, what it works on, the reason, and any other work that could proceed.
2. **Add the detail.** Run `cruze status` when the reason mentions approvals, and quote the documents and elements that changed.
3. **Answer** in three lines or fewer: the step to run, with its target, why it is next, and what else is in flight on other branches. Don't start the step unless the user asks you to.

## What the steps mean

| Step | Run |
| --- | --- |
| `envision` | `envision`, at project scope, or `envision "<target>"` for a roadmap feature |
| `architect` | `architect` at project scope, `architect "<feature>"`, or `architect "<target>"` as a tweak |
| `roadmap` | `roadmap`: approve the ordering, or close a finished release |
| `plan` | `plan` for the named change |
| `build` | `build`, on this branch |
| `verify` | `verify`, on this branch |
| `land` | `land`, on this branch |
| `rethink` | `rethink`: something approved changed, and the work citing it must be reviewed |
| `switch-branch` | Switch to the named branch, where that change is built |

When the user asks about something `cruze next` didn't name, such as a bug or an idea, point them to `triage` or `explore`.
