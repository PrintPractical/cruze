---
name: cruze-grilling
description: How to interview the user until design decisions are settled. Questions go in rounds over a tree of decisions, facts are looked up rather than asked, each question carries a recommendation, and challenges the user overrides are recorded. Use when a design step needs decisions from the user, when shaping an idea, vision, feature, architecture or plan with them, when the user steers toward something that breaks a rule, or when the user asks to be grilled or to stress-test a plan.
---

# Grilling

Interview the user until you both understand the design the same way. Decisions are the user's. Facts are yours to find.

## Running the interview

1. List the open decisions this step must settle, as a tree in which each decision hangs off the ones it depends on. Take them from the sections of the document the step writes and from what the user has already said. Done when every section the step writes has its decisions listed.
2. Settle the facts yourself. Anything the repository, the living docs, a `cruze` command or a primary source can answer is a fact, so look it up rather than asking. Where the agent can run a helper in parallel, send it to look while you ask about everything that doesn't depend on the answer.
3. Find the frontier: every open decision whose prerequisites are settled. A question that depends on another open question waits for a later round.
4. Ask the frontier as one round, in the format below. Every question carries your recommended answer and the reason for it.
5. Wait for the answers. Record each settled decision as described under Recording, then recompute the frontier.
6. Repeat until the frontier is empty: every branch visited, and nothing silently assumed.
7. List the settled decisions in a short summary and ask the user to confirm it. Done when the user confirms. Decisions and glossary terms are recorded as they settle; the design sections themselves (specs, architecture, plans) are written only after the confirmation.

## A round

```markdown
**Q4. Where the jump-host list lives**
Per device in the device config, or as named hosts that devices reference. Named hosts avoid repeating a host's address and credentials across devices, but add a second lookup.
Recommended: named hosts, because the lab config already shares two jump hosts across 30 devices.

**Q5. What a refused second hop reports**
...
```

- Number questions across the whole session, not per round, so an answer such as "Q7: yes" is never ambiguous.
- Keep a round to what the user can answer in one reply, about 3 to 7 questions. When the frontier is bigger, ask first the questions that others depend on.
- Ask about behaviour and trade-offs in the user's terms and the glossary's words, not about implementation mechanics.
- When the user answers "you decide" or "I don't know", take your recommendation and record it with "(recommended; the user deferred)".
- When an answer contradicts an earlier decision, point to that decision and ask which one stands.

## What to ask and what to decide

Ask the user when a choice affects any of these:

- Scope: what is in and what is out.
- A public contract, including the errors a caller sees.
- The architecture: contexts, ports, dependency direction and the module map.
- A dependency, always, through `.agents/skills/cruze-dependency-approval/SKILL.md`.
- Security, privacy or compliance.
- Compatibility, stored data or migration.
- A commitment that is costly or hard to reverse.

Decide yourself anything local and reversible, such as private names, file-local structure, internal representation and equivalent idioms. Pick the conventional option without asking. Uncertainty alone doesn't make a choice the user's: investigate first, and ask only when the evidence leaves two materially different valid outcomes.

## Challenge, then defer

When the user steers toward something that breaks a principle, an accepted ADR or a Cruze knowledge skill:

1. Name the rule, the concrete risk in this project and a recommended alternative, once. For example: "I'd push back on reading the config inside the SSH adapter. cruze-hexagonal-design keeps adapters from calling other adapters, and here the SSH adapter would silently depend on the file format. I recommend passing the resolved hop into the adapter. Your call."
2. The user decides, and their decision stands.
3. Record the override. It becomes an ADR when it passes the ADR test in `.agents/skills/cruze-formats/reference/durable-docs.md`; otherwise it becomes a settled decision that names the rule and the reason: `D4: the SSH adapter reads jump-host config directly, overriding cruze-hexagonal-design's adapter rule (the user wants one file for the prototype)`.
4. Never raise the same challenge again. Reviewers read the settled decisions and ADRs, so they won't either.

Be direct and precise, peer to peer. Challenge only with a specific reason, and never agree without thinking.

## Recording

- Record each decision as soon as it settles, not at the end.
- The workflow step names the document. Features and changes keep decisions in `## Settled decisions` as `D<n>: <decision> (<reason>)`. At project scope, the vision keeps goals, non-goals and constraints in their own sections, and other project decisions go in the architecture's `## Decisions` as `D<n>` lines. A decision that passes the ADR test becomes an ADR.
- Put a term in the glossary the moment it settles, following `.agents/skills/cruze-domain-language/SKILL.md`.
