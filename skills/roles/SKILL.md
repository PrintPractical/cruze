---
name: cruze-roles
description: Prompts for Cruze's fresh-context roles (the design reviewer and the researcher), how to run one, and how to take a review through its two rounds to a disposition for every finding. Use when a Cruze workflow step says to run a role, a review or research in a fresh context.
---

# Roles

A role is a prompt with fixed inputs and a report as its only output. It runs in a fresh context, so it judges the documents rather than the conversation that produced them. It never edits files.

| Role | File | Used by |
| --- | --- | --- |
| Design reviewer | [design-reviewer.md](design-reviewer.md) | architect, at project and feature scope |
| Researcher | [researcher.md](researcher.md) | architect, for adopt-or-build decisions |

## Running a role

1. Read the role file and gather exactly the inputs it lists. Done when you have every input path, plus any command output the role asks for.
2. Start a fresh context: a helper agent with no conversation history, where the agent can start one. Give it the role file's full text and the inputs the role lists, including draft documents it names, and nothing else. Your own opinions, the conversation and your reasons for the design stay out.
3. If the agent can't start a fresh context, the design reviewer must still run in one: tell the user, and have them run it in a new session with the role file and the inputs. The researcher may run in your own context, since its evidence is checkable; say that you did.
4. Take the report as it comes back. Check its evidence against the files before you act on any finding.

## Running a review

A review has at most two rounds. Only blockers can force the second one.

### Round 1

1. Commit the documents under review (`docs: <artifact> for design review`), so the fixes in round 2 have a diff. Then run the reviewer on the complete artifact.
2. Record the round: `cruze journal add review --set review=<design|plan|code> --set round=1 --set blockers=<n> --set concerns=<n>`, adding `--item <ref>` for a feature or change.
3. Present every finding to the user with your recommended disposition and why:
   - `fixed`: you will change the design as the finding proposes.
   - `waived`: the finding is right, but the user accepts the risk.
   - `deferred`: it belongs to later work. When it is future scope, add it with `cruze features add <slug> --summary <text> --goals <ids>`.
   - `rejected`: the finding is wrong, with the reason.
4. The user decides each one. Record each decision: `cruze journal add disposition --set finding="<rubric item>: <summary>" --set disposition=<fixed|waived|deferred|rejected> --set reason="<reason>" --set review=<design|plan|code>`, with the same `--item`. A recorded disposition is never raised again.
5. Apply every `fixed` change, then run `cruze validate`. Done when it reports no errors.
6. When a finding could be caught by a tool, such as a layering, naming or size rule, tell the user which `cruze check` rule or linter setting would catch it next time.

### Round 2

Run round 2 only when a round-1 blocker was fixed.

1. Run the reviewer again with its usual inputs, plus the round-1 blockers and the diff of their fixes. It checks only whether those blockers are fixed, and raises nothing new.
2. Record the round with `round=2`.
3. Take any blocker still open to the user, who fixes it now, waives it or starts a rethink. There is no round 3.

Done when every finding has a journaled disposition and no blocker is open without the user's decision.

## The settled ledger

Reviewers read the settled ledger so they never re-raise a decision. It consists of:

- The `## Settled decisions` of the feature or change under review.
- The `D<n>` lines in the `## Decisions` section of `docs/architecture.md`, and the accepted ADRs in `docs/adr/`.
- Earlier dispositions, from `cruze journal list --event disposition`.
