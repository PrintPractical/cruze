# Tasks leave out the files that declare what they add

- Proposal: a task that adds a module, file or dependency lists the file that declares it, such as a crate root, `mod.rs`, manifest or Xcode project, and the plan reviewer checks it.
- Evidence: ork bundle (Cruze 0.0.7): deviations on 2026-10-06-walking-skeleton at 2026-10-07T00:57 (T2), 01:00 (T5), 01:08 (T11, T12), 01:12 (T17), 01:13 (T18), 01:14 (T19), 01:16 (T21), 01:17 (T22), and at 2026-10-08T03:00 (01-sets-in-force T4, `config/mod.rs`). rto bundle: deviation at 2026-10-05T04:39 (03-detect-office-days T19, `project.pbxproj` wired early).
- Asset: skills/plan/tasks.md (step 3), skills/roles/design-reviewer.md (plan rubric item 2)

## Situation

On the console-access fixture, plan a change that adds a new module `src/access/recording/` and a new dependency for it.

## Expected

The task that creates the module lists `src/access/mod.rs` (or `src/lib.rs`) and `Cargo.toml` among its files.

## Check

Fixture run: headless `plan` then `build`. The task line names the declaring files, and no deviation mentions declaring a module or a dependency.
