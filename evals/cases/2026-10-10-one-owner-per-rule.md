# Rules were written twice and items built in the wrong task

- Proposal: plan's tasks step finds the owner of each rule, text, format or conversion several tasks apply and names it as a callee in the later tasks; an accessor, variant or type goes in the task whose code first handles it; the plan reviewer checks both.
- Evidence: 20 deviations consolidating a rule written twice, such as rto `2026-10-05-progress-dashboard/02-burn-up-chart` T1 "the rule moved into Progress.used(_:in:)" and ork `2026-10-07-generation-control/01-generation-control` T8 "private now() so the rule has one implementation"; 13 items built in another task than planned, such as ork `2026-10-07-configuration-sets/01-sets-in-force` T12 "Built Lifetime (listed in T13) here, since its first user".
- Asset: `skills/plan/tasks.md` (steps 2 and 4), `skills/roles/design-reviewer.md` ("Plan rubric", item 2)

## Situation

On the console-access fixture, `plan` writes the tasks for `02-ssh-hops`, where the hop timeout rule D2 is applied by both the SSH connector and the open-console use case.

## Expected

One task owns the timeout rule and the other names that file as a callee; no two tasks restate it. Each new error variant sits in the task whose code first matches it. The plan review reports no Tasks finding about a rule in two places.

## Check

Fixture run: headless `plan` on `02-ssh-hops`; read the task lines and the plan review report.
