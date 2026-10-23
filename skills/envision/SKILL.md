---
name: cruze-envision
description: Starts a project, or a major shift in one, by putting the user's vision on paper, breaking the release into features with what each needs, and designing the architecture map those features and the future ones fit into.
---

# Envision

Envision runs at the start of a project, when a release is done, and when the product changes direction: new users, a new major capability, something dropped, or a non-goal changed. A single feature or a change to features that exist goes to shape instead, even when it touches the architecture or a term. It turns the user's idea into three things everything later reads: a vision with future features, the release broken into features, and an architecture map designed with all of them in view. The user approves two documents once each, and the agent decides everything else.

Read `.agents/skills/cruze-asking/SKILL.md` before the first question, and `.agents/skills/cruze-formats/SKILL.md` before writing a document.

## Steps

1. **Take in what the user has.** The user's idea may be a sentence, a long document or a conversation. Read all of it, and the repository's README and code if there are any. When the user shares a document, keep it next to the docs, such as `docs/seed.md`, so nothing in it is lost. Done when you can say the product's purpose in one sentence.
2. **Write the vision.** Run `cruze new vision` if `docs/vision.md` doesn't exist, then fill in the problem, users, terms, non-goals and constraints from what the user said, in their words. Leave the Release and Future features tables for steps 3 and 4. Mark anything you inferred rather than read, so the user can see it.
3. **Ask what may come later,** as [possibilities.md](possibilities.md) says, and fill in `## Future features`. Done when the table holds every likely neighbour the user agreed to, each with what must stay possible.
4. **Break the release into features,** as [breakdown.md](breakdown.md) says, and fill in the `## Release` table. Done when `cruze validate` reports no release problem.
5. **Show the vision and the breakdown.** In one message: the product in two sentences; the release's features as a short table, with a plain-text diagram of what needs what; the future features in one line each; and every point you inferred. Ask one question: "Is anything missing, merged wrong, or in the wrong order?" Apply the answer. When the user approves, run `cruze approve vision`. Done when the vision is approved.
6. **Design the architecture map,** as [architecture.md](architecture.md) says. Done when `docs/architecture.md` exists, `cruze validate` reports no problem in it, and `.cruze/config.yaml` has its `source`, `tests` and `layers`.
7. **Show the architecture.** In one message, illustrated as `.agents/skills/cruze-asking/SKILL.md` says:
   - a plain-text diagram of the ports and adapters, marking which serve future features;
   - the runtime model in three lines: threads or tasks, the limits that matter, and what happens at shutdown;
   - the core ports as code, with their errors;
   - each technology choice and significant dependency, with why;
   - every decision you took that the user might question.

   Ask: "Do you approve this architecture, or what should change?" Apply changes and show what moved. When the user approves, run `cruze approve architecture`. Done when it is approved.
8. **Write the README** for someone who has never heard of the project: what it is and who it is for, in the vision's words; its status, such as "designing the first release", with the release's features in one line each; a short paragraph and the overview diagram of how it is built, in plain text so it reads anywhere; and where the vision, architecture and features live. Leave out what isn't true yet, such as install or usage steps. Done when nothing in it contradicts the vision or the architecture.
9. **Commit** the documents, the README and the config with a message such as `docs: envision <project>`.

## A major shift or the next release

When the vision exists, edit it rather than starting again: move built features out of `## Release`, add the next release's features and update what they need, and move future features in when they join. Change the architecture map only where the new features move a boundary. Then show what changed and approve as in steps 5 and 7, and bring the README's status up to date.

## Next step

`shape` for the first feature of the release, which `cruze next` names.
