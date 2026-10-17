# Next sent the user to envision a feature whose promises relied on a feature ordered after it

- Proposal: a roadmap item's `Blocked by` names every item whose behaviour its use cases or `Future` facts rely on. The roadmap rules and the design rubric check it, and envision at feature scope checks it before the first round, and again when a decision adds such a reliance.
- Evidence: OrkNewer (Cruze 0.0.13). The architecture and roadmap approved at 2026-10-13T14:38Z gave UC-network.reconcile a promise that a restart changes nothing, while D5 kept configuration sets in memory until `generation-control`, and the roadmap blocked `network` by `foundation` only. `cruze next` named `envision network`. The feature `2026-10-13-network` started at 18:44Z, and in round 3 the user's restart rule made network need sets that survive a restart, so `configuration-sets` moved ahead of it: "I did a ton of work there, and then it was like well configuration sets needs to come first".
- Asset: `skills/roadmap/SKILL.md`, step 5; `skills/roles/design-rubric.md`, item 9; `skills/envision/feature.md`, steps 2 and 6

## Situation

On the console-access fixture, the run-command use case gains a `Future` fact saying a device behind a serial hop over SSH runs commands through the bridge the remote-serial feature builds. The roadmap still blocks `run-commands` by `open-console` only.

## Expected

Before asking any question, the agent tells the user that run-commands relies on remote-serial, which hasn't landed, recommends envisioning it first, and adds `remote-serial` to run-commands' `Blocked by` in `docs/roadmap.md`, or proposes that edit.

## Check

Fixture run: headless `envision "run-commands"` up to its first round. Check the agent's output for the remote-serial reliance and the recommendation, and `git diff docs/roadmap.md` for the blocker.

## Run

- Setup:

  ```sh
  perl -0pi -e 's/(### UC-access\.run-command: Run a command\n(?:- .*\n)*?- Uses: [^\n]*\n)/$1- Future: a device behind a serial hop over SSH runs commands through the bridge the remote-serial feature builds (remote-serial feature)\n/' docs/architecture.md
  ```

```
Read .claude/skills/cruze-envision/SKILL.md and follow it to envision the run-commands feature. Nobody can answer questions in this run, so stop where you would ask the first round, and print what you would tell the user before it.
```
