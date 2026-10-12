import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { approveArtifact } from "../src/app/use_cases/approve_artifact.ts";
import { landChange } from "../src/app/use_cases/land_change.ts";
import { suggestNext } from "../src/app/use_cases/project_status.ts";
import { upstreamDiff } from "../src/app/use_cases/upstream_diff.ts";
import { BRANCH_01, CHANGE_01, FEATURE, approveDesign, buildChange, edit, exampleProject } from "./support/harness.ts";

describe("seeing what changed upstream of approved work", () => {
  // Ork: next sent a feature to a rethink for two file-list merges, and named only the element IDs.
  it("shows each changed element's approved text against its current text, and that a re-stamp needs no rebase", async () => {
    const h = await exampleProject();
    await approveDesign(h.deps);
    await buildChange(h, CHANGE_01, BRANCH_01);
    await landChange(h.deps, CHANGE_01);
    h.repository.commitAll(h.files.files);
    edit(h.files, "docs/architecture.md", "any other byte releases `0x1d`", "any other byte releases `0x1d` at once");
    await approveArtifact(h.deps, "architecture");

    const report = await upstreamDiff(h.deps, FEATURE);
    assert.equal(report.state, "upstream-changed");
    assert.deepEqual(report.rebase, []);
    assert.deepEqual(report.changes.map((c) => [c.key, c.path]), [["ENT-access.escape-detector", "docs/architecture.md"]]);
    const diff = report.changes[0]?.diff ?? [];
    assert.ok(diff.some((line) => line.startsWith("- ") && line.endsWith("releases `0x1d` followed by that byte, and the detector returns to `idle`")));
    assert.ok(diff.some((line) => line.startsWith("+ ") && line.includes("releases `0x1d` at once followed by")));
    assert.ok(!diff.some((line) => line.includes("Status:")));
    assert.match((await suggestNext(h.deps)).next.reason, /\(ENT-access\.escape-detector\); read cruze diff .*, and re-stamp it/);
  });

  it("names the rebase when the delta still changes an element whose living text moved", async () => {
    const h = await exampleProject();
    await approveDesign(h.deps);
    h.repository.commitAll(h.files.files);
    edit(h.files, "docs/architecture.md", "links are closed in the reverse order they were opened", "links are closed in the reverse order they were opened, within one second each");
    await approveArtifact(h.deps, "architecture");

    const report = await upstreamDiff(h.deps, FEATURE);
    assert.deepEqual(report.rebase, ["ENT-access.console-session"]);
    assert.ok((report.changes.find((c) => c.key === "ENT-access.console-session")?.diff ?? []).some((line) => line.includes("+ ") && line.includes("within one second each")));
    assert.match((await suggestNext(h.deps)).next.reason, /its delta changes ENT-access\.console-session, so rebase it/);
  });

  it("says so when the approval isn't committed, rather than guessing its text", async () => {
    const h = await exampleProject();
    await approveDesign(h.deps);
    edit(h.files, "docs/architecture.md", "links are closed in the reverse order they were opened", "links are closed in reverse order");
    await approveArtifact(h.deps, "architecture");
    const change = (await upstreamDiff(h.deps, FEATURE)).changes[0];
    assert.equal(change?.diff, undefined);
    assert.match(change?.note ?? "", /isn't committed yet/);
  });
});
