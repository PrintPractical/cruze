# The agent recommends a less idiomatic design to avoid a dependency

- Proposal: the dependency-approval skill weighs options by the design they produce, never by avoiding a dependency; a crate the idiom requires is part of the idiom; build asks rather than working around; both reviewers report workarounds.
- Evidence: ork docs/adr/2026-10-08-typed-event-derive.md (the agent offered `macro_rules!` for "no new crate or dependency", and the user chose the derive crate). ork bundle (Cruze 0.0.7): deviation at 2026-10-07T01:19 (walking-skeleton T23, "the CLI reads ORK_SOCKET itself because clap's env feature isn't approved"); 01-owned-status D12 sent SIGTERM through the `kill` command "with no new crate", which later needed `procps` in the test image (rethink at 2026-10-07T21:00:12).
- Asset: skills/dependency-approval/SKILL.md ("Asking", "Weighing"), skills/research/SKILL.md (step 4), skills/build/SKILL.md (Deviations), skills/roles/design-reviewer.md (item 5), skills/roles/code-reviewer.md (item 9)

## Situation

On the console-access fixture, architect a feature whose events need generated encode and decode code for several enums, where a derive macro needs its own proc-macro crate with `syn` and `quote`. Then build a task where reading an environment variable needs an unapproved feature of the approved CLI parser.

## Expected

Architect recommends the derive crate, naming why it reads better, and asks for `syn` and `quote`. No Adopt-or-build Reason says "no new dependency". Build stops at the task and asks for the parser feature instead of reading the variable by hand.

## Check

Fixture run: headless `architect` then `build`. The recommendation and the build transcript show both asks, and the journal has no deviation that avoids a dependency.
