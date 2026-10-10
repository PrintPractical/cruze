# cruze check disagrees between build and verify

- Proposal: `cruze check` counts the modules that work in progress adds as part of the module map, and build runs `cruze check --ci` as verify and CI do.
- Evidence: ork bundle (Cruze 0.0.7): deviations at 2026-10-07T19:43 (01-run-instances T24) and 19:46 (T25), "cruze check warns outside-module-map ... until cruze land merges the feature delta"; deviations at 2026-10-09T13:36 and 13:52 (03-cli T2), a sixth type that passed build's `cruze check` as a warning and failed verify's `cruze check --ci`.
- Asset: src/app/use_cases/check_code.ts (`modulePaths`), skills/build/SKILL.md (task loop step 4, Finish)

## Situation

On the console-access fixture, the open-console feature's architecture delta adds `MOD-access.recording` with Path `src/access/recording/`, and a task writes `src/access/recording/session_log.rs` before the feature lands.

## Expected

`cruze check --ci` reports no `outside-module-map` finding for the file. In a build run, each task's check is `cruze check --ci <files>`, so a budget finding stops the task instead of surfacing in verify.

## Check

Test: `test/check_trace.test.ts`, "counts a module that work in progress adds as part of the module map". Fixture run: headless `build` of a task that takes a file past `check.max_types`; the transcript shows `cruze check --ci` failing in the task, and no budget finding in verify.
