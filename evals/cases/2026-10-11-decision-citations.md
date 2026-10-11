# Living docs and code cite decisions that were archived

- Proposal: a settled decision is cited by number only inside the document that records it; `cruze validate` and `cruze check` report other citations as `decision-citation`, and `cruze approve` refuses a delta that has one.
- Evidence: Ork at 93cc650 (Cruze 0.0.9), reported by an independent code review: `docs/architecture.md` held 347 citations such as `(orchestration-runtime D23)` outside its `## Decisions`, and 134 comment lines in `crates/` cited `(D22)`, `(events D23)` or `(network-orchestrator D16 of 02-links)`, all pointing into `.cruze/archive/`.
- Asset: skills/formats/SKILL.md ("Decisions"), src/domain/validation/decision_rules.ts, src/domain/check/decision_comments.ts, src/app/use_cases/approve_artifact.ts

## Situation

On the console-access fixture, the open-console feature's architecture delta cites its own `D1` in an element body, and a source comment cites `(open-console D1)`.

## Expected

`cruze validate` warns `decision-citation` on the delta element, `cruze approve 2026-09-25-open-console` refuses with `decision-cited`, and `cruze check` warns on the comment, pending until the project's `standards:` reaches 0.0.10.

## Check

Test: `test/decision_citations.test.ts`.
