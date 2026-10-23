---
name: cruze-brainstorm
description: Works out with the user how a feature, a change or a new direction should go, in as many rounds as they want, before anything is written, then hands what was settled to the step that writes it.
---

# Brainstorm

The user and you design together before you write anything. You bring the research, the options and a recommendation; the user steers and sets the pace. Write no project document until the discussion is done.

Read `.agents/skills/cruze-asking/SKILL.md`: its way of showing a question applies here, and its limit on rounds doesn't.

## Steps

1. **Start from research.** When the step that brought you here has researched, use that. Otherwise research the subject as step 2 of `.agents/skills/cruze-shape/SKILL.md` says. Done when you can say what exists that the subject touches.
2. **List the open questions:** the choices the subject turns on that the user would want a say in, such as what a user sees, a public API, the model of a concept, or scope. Show them with what research found, and start with the one the others hang on, unless the user picks another.
3. **Discuss one question at a time.** Show the options as the asking skill says, what each costs and rules out, and your recommendation in one line. Check a point that needs evidence, and only that point, in the code or with the researcher role. Follow the user's lead: a new option, a push back, or another question. Done for a question when the user settles it or hands it to you.
4. **Keep the list.** End every message with what is settled, one line each, and what is still open.
5. **Close** when the user says so, or nothing is open, by showing the settled list for the user to confirm.
6. **Hand it over** to the step that writes it:
   - a feature, or a change to features that exist: shape;
   - the vision, the release, or a new direction: envision;
   - only how the code is built: refactor.

   Run it next. It takes each settled point as given, without asking again, and records those a reader would question in `## Decisions` as chosen with the user. When the user will run it later, put the settled list in the feature's `## Decisions` when its file exists, or else in the issue the work comes from.

## Next step

The step that step 6 names.
