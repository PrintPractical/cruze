import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { approveDocument } from "../src/app/use_cases/approve_document.ts";
import { showStatus } from "../src/app/use_cases/project_status.ts";
import { CruzeError } from "../src/domain/cruze_error.ts";
import { OPEN_SERIAL, edit, exampleProject } from "./support/harness.ts";

const stateOf = async (deps: Parameters<typeof showStatus>[0], slug: string) => (await showStatus(deps)).features.find((f) => f.slug === slug)?.approval;

describe("approving a document", () => {
  it("records who approved it and when, and shows it approved", async () => {
    const h = await exampleProject();
    const record = await approveDocument(h.deps, "open-serial");
    assert.equal(record.path, OPEN_SERIAL);
    assert.equal(record.by, "Test User <test@example.com>");
    assert.match(record.hash, /^sha256:/);
    assert.equal(await stateOf(h.deps, "open-serial"), "approved");
    const saved = JSON.parse(h.files.files.get(".cruze/approvals.json") ?? "");
    assert.deepEqual(saved.approvals.map((a: { path: string }) => a.path), [OPEN_SERIAL]);
  });

  it("shows the document edited after any change to its design, and approved again once re-approved", async () => {
    const h = await exampleProject();
    await approveDocument(h.deps, "open-serial");
    edit(h.files, OPEN_SERIAL, "Connected to r1", "Attached to r1");
    assert.equal(await stateOf(h.deps, "open-serial"), "edited");
    await approveDocument(h.deps, "open-serial");
    assert.equal(await stateOf(h.deps, "open-serial"), "approved");
    assert.equal(JSON.parse(h.files.files.get(".cruze/approvals.json") ?? "").approvals.length, 1);
  });

  it("keeps a feature approved when build marks it built", async () => {
    const h = await exampleProject();
    await approveDocument(h.deps, "open-serial");
    edit(h.files, OPEN_SERIAL, "- Status: shaped", "- Status: built");
    assert.equal(await stateOf(h.deps, "open-serial"), "approved");
  });

  it("approves the vision and architecture by name, and a feature by path", async () => {
    const h = await exampleProject();
    for (const ref of ["vision", "architecture", "docs/features/list-devices.md"]) await approveDocument(h.deps, ref);
    const status = await showStatus(h.deps);
    assert.deepEqual(status.documents.map((d) => d.state), ["approved", "approved"]);
    assert.equal(status.features[0]?.approval, "approved");
  });

  it("refuses a document with format errors, and one that doesn't exist", async () => {
    const h = await exampleProject();
    edit(h.files, OPEN_SERIAL, "## Public API", "## API");
    await assert.rejects(approveDocument(h.deps, "open-serial"), (e: unknown) => e instanceof CruzeError && e.code === "invalid" && /## Public API/.test(e.message));
    await assert.rejects(approveDocument(h.deps, "teleport"), (e: unknown) => e instanceof CruzeError && e.code === "not-found");
    h.files.files.delete("docs/architecture.md");
    await assert.rejects(approveDocument(h.deps, "architecture"), (e: unknown) => e instanceof CruzeError && e.code === "not-found");
  });
});
