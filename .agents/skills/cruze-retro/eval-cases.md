# Eval cases

An eval case pins a retro proposal to the evidence that prompted it, so the fix can be checked now and protected later. Write each one to `evals/cases/<date>-<slug>.md`.

```markdown
# <One-line name of the failure>

- Proposal: <the change, one sentence>
- Evidence: <bundle, then each entry's item and at>
- Asset: <path of the skill, rubric, template or rule changed>

## Situation

<What the project and the agent were doing, in enough detail to reproduce it on the console-access fixture.>

## Expected

<What Cruze should make happen now, stated so that someone can check it.>

## Check

<One of the kinds below.>
```

Pick the strongest check that fits:

1. **A test** in `test/`: required for a CLI rule. It reproduces the entry's situation through the use cases and asserts the new behaviour.
2. **A load check**: for a skill that must now read a file it skipped. Name the skill and the file, and run `node evals/load_check.ts` on a transcript of the fixture run.
3. **A fixture run**: for a change in how a skill guides the agent. Write the prompt for a headless run on the console-access fixture that walks into the situation, and the observable result to look for in the journal or the documents.

Done when the case names its evidence and its check, and a check of kind 1 exists and passes.
