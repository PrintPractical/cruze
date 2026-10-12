import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { approveArtifact } from "../src/app/use_cases/approve_artifact.ts";
import { showStatus, suggestNext } from "../src/app/use_cases/project_status.ts";
import { validate } from "../src/app/use_cases/validate_project.ts";
import { approveDesign, edit, exampleProject } from "./support/harness.ts";

const FUTURE = "- Future: serial hops behind an SSH hop run a bridge command over the SSH link (remote-serial feature)";

describe("keeping the vision's long-term intent in front of every design", () => {
  // Ork: a feature reversed a principle that lived only in a seed note, and long-term plans lived only in the user's head.
  it("lets a design cite a principle or a must-stay-possible capability, and refuses one the vision doesn't define", async () => {
    const h = await exampleProject();
    edit(h.files, "docs/architecture.md", FUTURE, `${FUTURE}\n- Future: a session's output can fan out to several terminals, as LATER-shared-sessions needs; paths follow PRINCIPLE-config-is-truth`);
    assert.deepEqual((await validate(h.deps)).problems, []);
    edit(h.files, "docs/architecture.md", "as LATER-shared-sessions needs", "as LATER-shared-screens needs");
    assert.ok((await validate(h.deps)).problems.some((p) => p.rule === "unknown-id" && p.message.includes("LATER-shared-screens")));
  });

  it("makes every design that cites a capability stale when the vision changes it", async () => {
    const h = await exampleProject();
    edit(h.files, "docs/architecture.md", FUTURE, `${FUTURE}\n- Future: a session's output can fan out to several terminals, as LATER-shared-sessions needs`);
    await approveDesign(h.deps);
    edit(h.files, "docs/vision.md", "| possible | Lab devices", "| likely | Lab devices");
    assert.equal((await suggestNext(h.deps)).next.step, "envision");
    await approveArtifact(h.deps, "vision");
    const architecture = (await showStatus(h.deps)).documents.find((d) => d.artifact === "docs/architecture.md");
    assert.equal(architecture?.state, "upstream-changed");
    assert.deepEqual(architecture?.changed, ["LATER-shared-sessions"]);
  });
});
