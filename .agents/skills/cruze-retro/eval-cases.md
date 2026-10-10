# Eval cases

An eval case pins a retro proposal to the evidence that prompted it, so the fix can be checked now and protected later. Write each one to `evals/cases/<date>-<slug>.md`.

````markdown
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

## Run

- Setup:

  ```sh
  <commands that put a copy of the fixture into the situation, run before the agent starts>
  ```

- Tools: Read,Edit,Write,Grep,Glob,Bash

```
<the prompt to give the agent on the fixture copy>
```
````

Pick the strongest check that fits:

1. **A test** in `test/`: required for a CLI rule. It reproduces the entry's situation through the use cases and asserts the new behaviour.
2. **A load check**: for a skill that must now read a file it skipped. Name the skill and the file, and run `node evals/load_check.ts` on a transcript of the fixture run.
3. **A fixture run**: for a change in how a skill guides the agent. Write the prompt for a headless run on the console-access fixture that walks into the situation, and the observable result to look for in the journal or the documents. Put the prompt in a `## Run` section, so `node evals/run.ts <case>` can execute and grade it.

The `## Run` section is optional, and a case without one is a manual case. It holds:

- `- Setup:`, optional, followed by a fenced `sh` block of commands run inside the fixture copy before the agent starts, such as an edit that creates the situation.
- One other fenced block, holding the prompt to give the agent.
- `- Tools: <value>`, optional, the agent's allowed tools; the default is `Read,Edit,Write,Grep,Glob,Bash`.

The runner grades the result against `## Expected` and `## Check` with a second headless run; see `evals/README.md`.

Done when the case names its evidence and its check, and a check of kind 1 exists and passes.
