# Illustrating a question

The user decides from what they can picture. A question about a port's errors or a module's place is hard to answer from words alone, and the user is often coming back from other work. So every question, review exception and confirmation shows what each option looks like, and reads on its own without the conversation before it.

## Reading cold

- The user knows what the product should do, not the design's internals. Before a question about a part of the design, say in a sentence or two what that part is, what it does today and why the question comes up, and show it. Ask about what the user will notice, and explain the mechanism only as far as the choice needs. In one day of one project, the user asked four times what a question meant, from "what's the definition of a condition?" to "give me an ELI5".
- Open each round, and each message of review exceptions, with one line saying where things stand: the work item, the step, and the earlier decisions this round builds on, such as `Where we are: architect for 2026-10-08-subscriptions, round 3. Settled: one stream per session, and events carry revisions.`
- The user doesn't know the design's IDs by heart. Name each requirement, scenario, element, decision or task in plain words, and add its ID after them in parentheses only when the user may want to look it up: "a second set asking for a priority already taken is refused (SCN-configuration.reject-taken-priority)". Never let an ID stand alone or be what a sentence is about, as in "D11 forbids this". In one project, 197 of the 215 IDs in 75 questions stood alone, and the user misread what was asked.
- Each question says what it decides and why it matters now, without pointing back to an earlier message.

## Choosing the illustration

Show each option, side by side, with the form that fits what the question decides:

| The question decides | Show |
| --- | --- |
| What a user does or sees | The command they type and its exact output, or a plain-text sketch of the screen, using the scenario's concrete values |
| A port, a use case's input and errors, or a public API | A code sketch in the project's language: the types and signatures, and the call a caller writes |
| Where something lives: contexts, modules, dependency direction | A box-and-arrow diagram, or the directory tree with the files the option adds |
| An order of steps, or what happens on failure | A numbered sequence or a plain-text sequence diagram, with the failure branch |
| States and what moves between them | The states with their transitions, one per line |
| A stored format or a config file | A sample of the file |
| A dependency | The code with it and the code without it |

Leave out the illustration only when the question is about a name, a number or the wording of a sentence, where it would repeat the words. A question asked through a pick-one tool carries it too: in each option's preview where the tool has one, otherwise in a message just before. One build asked through such a tool with only file and function names in its options, and the user had to ask what it meant.

## Writing it

- Use the design's names and the glossary's words, and the values of a real scenario, so the user sees this project's code, not a generic example.
- A code sketch shows shape: types, signatures, the error variants, and one call site. Leave bodies out, writing `...` or the language's placeholder. Keep each option to about 15 lines.
- Draw diagrams in plain text, so they read in a terminal, where Mermaid shows only as source. The documents keep their Mermaid diagrams; the illustration is for the conversation.
- At envision, show behaviour only: interactions and screens, never code, since envision keeps implementation out.
- Mark your recommended option in the illustration itself, and show the failure case when the options differ in how they fail.

## After the answer

A shape the user chose from a sketch is part of the decision. Write it into the document in that document's format: the port's `Operations`, the entity's facts, the module's `Path`, or the scenario's values. Build follows the documents, so the code comes out as the user saw it.
