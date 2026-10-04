# Changes split finer than their review and verify are worth

- Proposal: `architect` sizes changes at about 8 to 25 tasks and merges small changes that continue each other; `cruze validate` warns `change-too-small`, `change-too-large` and `plan-too-large`, with thresholds under `changes:`; reviewers list concerns in proportion to the work.
- Evidence: the ReturnToOffice project's policy-setup feature (Cruze 0.0.4): changes 02-policy-in-settings, 04-change-policy and 05-first-office-step had 4, 5 and 2 tasks and built 2, 2 and 1 elements, on the same Settings and setup screens, in a strict chain. Each paid for a plan review, a code review, a verifier run and a land: 05 took 2h45m for 2 tasks, while the 22-task 01-first-run-setup took 5h. Review findings didn't grow with size: 1/2/2 on the 2-task plan, 2/5/7 on the 22-task one. architect's step 12 split any change of more than about 12 tasks.
- Asset: skills/architect/feature.md (steps 9 and 12), skills/roles/design-reviewer.md (Slicing), src/domain/validation/size_rules.ts

## Situation

On the console-access fixture, without `changes:` in `.cruze/config.yaml`, run `cruze validate`.

## Expected

It warns `change-too-small` on 02-ssh-hops, which builds 2 elements after an 11-task first change. With `max_scenarios: 4` and `max_tasks: 10`, it warns `change-too-large` on 01-local-serial's row and `plan-too-large` on its plan.

## Check

Tests in `test/validate.test.ts`: "warns when a change is too small to be worth its own review and verify", and "warns when a change, or its plan, is more than one review and one verifier run can hold".
