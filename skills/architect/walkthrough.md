# The design walkthrough

The walkthrough hands the design to the user in one message: a short overview in plain terms, then the documents to review in full. The documents are the design, and the user reads them faster than you can retell them, so present the whole design at once and wait for one answer: approval, or comments.

At feature scope, cover only what the feature adds, changes or removes. At project scope, cover the whole architecture, the layer rules, the roadmap and the walking skeleton.

## The overview

Write it in the glossary's terms, as what callers can do and what happens when they do, not as a list of elements. Keep the prose to what the user can read in a minute, and open it with the line that says where things stand, from `.agents/skills/cruze-grilling/illustrating.md`.

1. **What it does.** The intent in two sentences. Then one line per use case, or at feature scope per requirement: who asks for what, what they get, and the main way it fails.
2. **What it touches.** Each new external system, and each new dependency named with its purpose and the approval behind it. Also each component you chose to build yourself, with the reason.
3. **What it looks like.** Illustrated as `.agents/skills/cruze-grilling/illustrating.md` says:
   - A plain-text diagram of the main scenario crossing the design: the inbound adapter, the use case, the domain elements and the ports, marking what is new.
   - A code sketch, in the project's language, of what the new and changed elements look like: the port operations and use case signatures with their errors, the main entity, and the call an inbound adapter makes.
4. **The slices.** The changes in order, one line each, saying what each delivers and why the first is first. At project scope, the roadmap's phases and the walking skeleton instead.
5. **What is yours to decide.** The review findings the roles skill brings to the user, any `cruze validate` warning still standing, such as a change over its size limit, any point where a fresh implementer could still build something different, and any rule you challenged that the user overrode.

## The documents

List each file the user should read in full, with the sections that changed:

- Feature scope: the feature's `feature.md`, and the ADRs it adds.
- Project scope: `docs/architecture.md`, the `layers:` in `.cruze/config.yaml`, `docs/roadmap.md`, the walking-skeleton `change.md`, and the ADRs in `docs/adr/`.

The documents' diagrams are Mermaid. Say where the user can render them, such as an editor preview or GitHub, rather than pasting them; the overview's plain-text sketches are for reading in the conversation.

End the message with: "Read these in full, then tell me what to change, or approve. Do you approve this design?"

## Ending

1. Answer a question from the documents, pointing to the file and section, and answer only what was asked.
2. A request for changes is not an approval. Apply the changes and run `cruze validate`. When the user edited the documents themselves, read their diff and run `cruze validate` on it. When the changes touch placement, dependency direction, adopt-or-build decisions, port contracts or flows, run a new design review on the diff alone. Then say in a few lines what changed and where, and ask again.
3. When the user rejects the design outright, don't approve anything. Ask what is wrong. When the problem is what to build, go back to `envision`; when it is the whole approach, restart this step's design; when the user wants to stop, leave the work unapproved and say how to resume.
4. Done when the user says they approve.
