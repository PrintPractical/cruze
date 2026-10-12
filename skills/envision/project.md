# Envision at project scope

The result is an approved `docs/vision.md` and a `docs/glossary.md` holding the terms that settled. Formats: `.agents/skills/cruze-formats/reference/durable-docs.md`.

1. **Create the documents.** Run `cruze new vision` and `cruze new glossary` for whichever doesn't exist yet. When the vision exists and you are reworking it, edit it in place. Bounded contexts don't exist yet, so group the glossary's terms under one `##` heading naming the product's domain, such as `## Console access`. `architect` regroups them by context.
2. **Take in the input** as [intake.md](intake.md) describes, then draft every section you can from the parts handed to `vision`, marking each as a question for step 3. Done when every part of the input has a hand-off row.
3. **List the open decisions,** section by section:
   - **Problem:** the problem in the user's words, and who feels it.
   - **Users:** each kind of user and the situation they are in.
   - **Goals:** each goal as a `GOAL-<name>` row, with a measure that says how you would know it's met. A goal without a measure is still open.
   - **Non-goals:** what the product deliberately doesn't do, and why. Ask about the tempting neighbours of each goal.
   - **Constraints:** platforms, the implementation language, dependency policy, performance, security, privacy, licensing and legal limits.
   - **Principles:** each rule every design must follow, as a `PRINCIPLE-<name>` row with why it holds. Ask about the rules behind the user's choices, such as what state and events are each for.
   - **Must stay possible:** each capability the product may need after this release, as a `LATER-<name>` row, explored as [possibilities.md](possibilities.md) describes.
   - **Feature map:** the capabilities that deliver the goals, each a slug with a one-line summary and the goals it serves. They are what later `envision "<feature>"` runs pick up.
4. **Grill in rounds** until every open decision is settled, following the grilling skill. As each domain term settles, add it to the glossary. Once the goals and feature map have settled, ask about what may come later, as [possibilities.md](possibilities.md) describes.
5. **Write the vision.** Fill each section, and remove every template guide.
6. **Fill the feature map.** For each capability, run `cruze features add <slug> --summary "<summary>" --goals <GOAL IDs>`. Put command syntax in backticks, such as `` `consolectl console <device>` ``, so it isn't read as a template guide. Running `add` again for the same slug replaces its entry in place. Done when every goal is served by at least one feature on the map.
7. **Confirm.** Walk the user through the vision in one short summary: the problem, the goals with their measures, the non-goals, the constraints, the principles, what must stay possible, and the feature map. Name what the hand-off gives each later step, and anything dropped, and why. Ask whether it matches their understanding, and apply any corrections.
8. **Approve.** When the user approves, run `cruze approve vision` and quote its result.
9. **Introduce the project in the README.** Under the title of `README.md`, write one paragraph drawn from the vision's Problem, Users and Goals: what the product is, who it is for, and why it exists, ending with a link to `docs/vision.md`. Keep anything already there that is still true. Done when `cruze validate` reports no `readme-overview` warning.
10. **Commit,** with a message such as `docs: envision the project`.

Done when `cruze status` shows `docs/vision.md` approved, the README says what the project is, and the glossary holds every domain term the vision uses.
