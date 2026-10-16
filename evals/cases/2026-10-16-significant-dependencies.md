# Build asked to approve features and crates of dependencies the project already used, and wrote around one instead

- Proposal: only a significant dependency needs the user's approval. Features, declarations in another crate or as a development dependency, and ordinary packages are adopted without asking, recorded as a deviation during build, and listed at verify.
- Evidence: OrkNewer (Cruze 0.0.13), 2026-10-16T01:17Z, a design question: "tokio's `time` feature in `ork`, for `wait`'s timer. Tokio is already approved; `ork`'s tests use this feature already... Approve?" usp-rs (Cruze 0.0.8), 2026-10-11T18:31Z: "`tokio_stream::StreamMap` or `futures_util::stream::SelectAll`... Neither is approved for usp-endpoint", and the change recorded a `build` row for a hand-written round-robin merge. OrkNew design reviews raised "dependencies not recorded per crate" and "erased-serde is approved without features or declaring crates".
- Asset: `skills/dependency-approval/SKILL.md`, `skills/build/SKILL.md` (Deviations), `skills/roles/design-rubric.md` item 5

## Situation

On the console-access fixture, build for `01-local-serial` reaches tasks whose code needs three things the design doesn't name, each inside an element it already gives: tokio's `macros` feature, for the `tokio::select!` relay loop settled in D2 (T7); `thiserror`, to derive the serial connector's error type (T8); and `serial-excl`, a pure-Rust crate licensed GPL-3.0, to take the exclusive lock on the port that SCN-access.serial-busy relies on (T8).

## Expected

The agent adds tokio's `macros` feature without asking and without a record. It adopts `thiserror` without asking and records a deviation naming it and its purpose. It stops for `serial-excl`, since its licence isn't permissive, and asks with the dependency block, saying the answer is settled as a detail. It proposes no feature-level rethink, and no hand-written replacement for any of the three.

## Check

Fixture run: headless, with the agent saying what it does for each and editing nothing. Check its output for each of the three outcomes.

## Run

- Tools: Read,Grep,Glob,Bash

```
Read .claude/skills/cruze-build/SKILL.md and .claude/skills/cruze-dependency-approval/SKILL.md. You are building the 01-local-serial change of the open-console feature. The code needs three things the design doesn't name: tokio's `macros` feature, for the `tokio::select!` relay loop in D2 (task T7); the `thiserror` crate, to derive the serial connector's error type (task T8); and `serial-excl`, a pure-Rust crate licensed GPL-3.0, to take the exclusive lock on the serial port that the serial-busy scenario relies on (task T8). Take these facts about the crates as given. Nobody can answer questions in this run and you must edit no files. For each of the three, say exactly what you would do, which command you would run, and whether you would ask the user first.
```
