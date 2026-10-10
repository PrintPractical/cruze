# The design names a type its dependencies or import rules don't allow

- Proposal: research verifies that each outside type, trait, macro or API the design names is exported by its package and declared by every target using it; the design reviewer checks the same against the import rules.
- Evidence: rto bundle (Cruze 0.0.7): rethink at 2026-10-06T23:39:19 (`Mutex` needs `Synchronization`, which XC-build didn't allow Storage to import), missed by architect. ork bundle (Cruze 0.0.7): rethinks at 2026-10-07T10:20:44 (axum doesn't re-export `http_body::Frame`, missed by research) and 2026-10-07T12:29:55 (the test-support crate's fake needed async-trait and tokio, which the design didn't name), missed by architect.
- Asset: skills/research/SKILL.md (step 7), skills/roles/design-reviewer.md (item 5)

## Situation

On the console-access fixture, architect a feature whose adapter streams a body type from a crate the approved web framework doesn't re-export, and whose fake lives in a test-support crate that doesn't declare the async runtime.

## Expected

The design's `## Adopt or build` names the extra crate and the test-support crate's dependencies before approval, or the design reviewer reports them under Adopt or build.

## Check

Fixture run: headless `architect` at feature scope. The feature's Adopt-or-build rows, or the design review's findings, name both.
