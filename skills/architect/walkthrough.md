# The design walkthrough

The walkthrough is where the user comes to understand the design well enough to explain it without you. It is the one heavy gate before code. Show the design as it stands in the files, one part at a time, in the order below. Pause after each part for questions.

At feature scope, show only what the feature adds, changes or removes, next to the current elements it touches. At project scope, show the whole architecture.

## Order

1. **What it does.** The intent in two sentences, then each requirement with its scenarios' titles.
2. **Where it sits.** The `VIEW-context` diagram, or at feature scope, the contexts the feature touches.
3. **The domain.** The domain-model class diagram, then each new or changed entity: its invariants, its states and who owns it.
4. **How it runs.** For each key flow, show its `sequenceDiagram` and walk one scenario through it step by step, including one failure path. This is the part the user must be able to retell.
5. **The seams.** Each new or changed port with its operations and their contracts, then the adapter behind each one and the library it adopts.
6. **Dependencies.** Every new dependency, named out loud with its purpose and the approval behind it. Also the components you chose to build yourself, with the reason.
7. **Where the code goes.** Each new element next to its module, file path and layer, and the layer rules those files must obey. At project scope, also the `layers:` in `.cruze/config.yaml`.
8. **The slices.** The changes in order, with what each delivers and builds, and why the first is first. At project scope, the roadmap's phases and the walking skeleton instead.
9. **Decisions and review.** The settled decisions and ADRs, each review finding with its disposition, and the points where a fresh implementer could still build something different.

## Showing diagrams

Mermaid diagrams live in the documents, so point to the file and line of each one, and paste its source into the conversation. When the user can render Mermaid (an editor preview, or GitHub), say where to open it. Keep each diagram under 15 nodes; split a bigger picture instead of shrinking it.

## Ending

1. Ask the user to explain one flow back in their own words, or to name what they would still find surprising in the code. Treat their answer as the check that the walkthrough worked, and go back over any part they can't retell.
2. Ask for approval in these words: "Do you approve this design?"
3. A request for changes is not an approval. Apply the changes and run `cruze validate`. When they touch placement, dependency direction, adopt-or-build decisions, port contracts or flows, run a new design review on the diff alone. Then walk through only the parts that changed, and ask again.
4. When the user rejects the design outright, don't approve anything. Ask what is wrong. When the problem is what to build, go back to `envision`; when it is the whole approach, restart this step's design; when the user wants to stop, leave the work unapproved and say how to resume.
5. Done when the user says they approve.
