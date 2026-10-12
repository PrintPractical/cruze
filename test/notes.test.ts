import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createNote } from "../src/app/use_cases/new_project_doc.ts";
import { showNotes } from "../src/app/use_cases/show_notes.ts";
import { showScope } from "../src/app/use_cases/show_scope.ts";
import { validate } from "../src/app/use_cases/validate_project.ts";
import { CHANGE_01, FEATURE, edit, exampleProject } from "./support/harness.ts";

const INTAKE = `# Intake: console tool brief

- Date: 2026-09-26
- Kind: intake
- About: project

## Sources

- \`.cruze/notes/2026-09-20-brief.md\`, the user's product brief

## Hand-off

| Part | Source | Goes to | Status |
| --- | --- | --- | --- |
| Problem and users | brief, "Why" | vision | settled |
| Transport choice | brief, "Connecting" | architect | open |
| Detach behaviour | brief, "Escape key" | \`open-console\` | open |
`;

// One project held 21 notes, and a 9,500-word seed whose design sections no step was told to read.
describe("notes reach the work they inform", () => {
  it("lists in cruze show the notes about a feature or its contexts, and the parts of the input handed to it", async () => {
    const h = await exampleProject();
    await createNote(h.deps, "serial-libraries", "Serial libraries", "research", "access");
    await createNote(h.deps, "billing-ideas", "Billing ideas", "explore", "billing");
    h.files.files.set(".cruze/notes/2026-09-26-intake.md", INTAKE);
    const notes = (await showScope(h.deps, CHANGE_01)).notes;
    assert.deepEqual(notes.notes.map((n) => [n.path, n.kind]), [[".cruze/notes/2026-09-26-serial-libraries.md", "research"]]);
    assert.deepEqual(notes.handoffs.map((r) => [r.part, r.status, r.note]), [["Detach behaviour", "open", ".cruze/notes/2026-09-26-intake.md"]]);
    assert.equal((await showScope(h.deps, FEATURE)).notes.handoffs.length, 1);
  });

  it("lists every note with its kind and subjects, or the notes and hand-offs for one target", async () => {
    const h = await exampleProject();
    h.files.files.set(".cruze/notes/2026-09-20-brief.md", "# Product brief\n\nAn old note with no kind.\n");
    h.files.files.set(".cruze/notes/2026-09-26-intake.md", INTAKE);
    const all = await showNotes(h.deps);
    assert.ok("notes" in all && !("target" in all));
    assert.deepEqual(all.notes.map((n) => [n.title, n.kind, n.about]), [["Product brief", undefined, []], ["Intake: console tool brief", "intake", ["project"]]]);
    const architect = await showNotes(h.deps, "architect");
    assert.ok("target" in architect);
    assert.deepEqual(architect.handoffs.map((r) => r.part), ["Transport choice"]);
    assert.deepEqual((await showNotes(h.deps, "project")).notes.map((n) => n.title), ["Intake: console tool brief"]);
  });
});

describe("Future facts", () => {
  it("warn when they keep room for a need nobody named, and accept a LATER capability or a mapped feature", async () => {
    const h = await exampleProject();
    const future = "- Future: serial hops behind an SSH hop run a bridge command over the SSH link (remote-serial feature)";
    edit(h.files, "docs/architecture.md", future, `${future}\n- Future: the session may one day fan out`);
    const problems = (await validate(h.deps)).problems.filter((p) => p.rule === "future-unanchored");
    assert.equal(problems.length, 1);
    assert.equal(problems[0]?.severity, "warning");
    edit(h.files, "docs/architecture.md", "- Future: the session may one day fan out", "- Future: the session may one day fan out, as LATER-shared-sessions needs");
    assert.deepEqual((await validate(h.deps)).problems, []);
  });

  it("are allowed on any element kind", async () => {
    const h = await exampleProject();
    edit(h.files, "docs/architecture.md", "- Module: MOD-access.domain\n- File: `src/access/domain/console_session.rs`", "- Module: MOD-access.domain\n- File: `src/access/domain/console_session.rs`\n- Future: a session may gain viewers, as LATER-shared-sessions needs");
    assert.deepEqual((await validate(h.deps)).problems, []);
  });
});
