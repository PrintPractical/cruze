---
name: cruze-domain-language
description: How to build the project's shared language in docs/glossary.md and use it the same way in conversation, documents, IDs and code. Use when a new domain term comes up, when the user or a document uses a vague, overloaded or conflicting word, when naming an element, ID, type, module, function or test, or when writing or reviewing the glossary.
---

# Domain language

Use one word per concept, everywhere: in conversation, specs, the architecture, IDs and code. `docs/glossary.md` holds those words, in the format given in `.agents/skills/cruze-formats/reference/durable-docs.md`.

## While designing

1. Read the glossary before the conversation starts, and use its words in your own questions and documents.
2. When the user uses a term differently from the glossary, say so immediately: "The glossary defines a hop as one link in a console path, but you seem to mean the jump host itself. Which is it?"
3. When a word is vague or overloaded, such as account, item, session, handle or data, propose one precise term and say what it excludes.
4. Test a boundary between two concepts with a concrete edge case: "A device reachable over two console paths: is that one device or two?"
5. When the user says how something works, check the living docs and the code. Point out any contradiction instead of choosing a side.
6. Write a term into the glossary the moment it settles. The glossary isn't approval-gated, so adding a term never makes a design stale.

Done when every domain noun in the documents this step writes is in the glossary or is a general programming term.

## What belongs

- Terms specific to this domain. General programming concepts, such as timeout, retry or cache, stay out unless the domain gives them a special meaning.
- A definition says what the thing is, in one or two sentences a domain expert would accept. It never mentions types, files, tables or other implementation.
- Pick one word per concept and list its synonyms under `_Avoid_`.
- Group terms under their bounded context. A word that means different things in two contexts gets an entry in each, and the translation happens where the contexts meet.

## Using the language

- Element titles and ID names use glossary terms: `ENT-inventory.console-path`, not `ENT-inventory.route`.
- Types, modules, functions and tests in code use the same words, in the language's naming style: `ConsolePath` in `console_path.rs`.
- A word listed under `_Avoid_` in a new title, ID, type or test name is a review finding. Rename it, or settle the term with the user.
- When a term is renamed, update the glossary and rename element titles freely. IDs keep their old wording, because an ID never changes. Code follows through a change like any other.

## Terms and decisions

The glossary holds language, not decisions. Record decisions as `.agents/skills/cruze-grilling/SKILL.md` describes.
