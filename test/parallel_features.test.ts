import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { approveArtifact } from "../src/app/use_cases/approve_artifact.ts";
import { initProject } from "../src/app/use_cases/init_project.ts";
import { landChange } from "../src/app/use_cases/land_change.ts";
import { showStatus } from "../src/app/use_cases/project_status.ts";
import { validate } from "../src/app/use_cases/validate_project.ts";
import { ScriptedPrompter } from "./fakes/fake_bundle.ts";
import { MemoryProjectFiles } from "./fakes/memory_project_files.ts";
import { BRANCH_01, CHANGE_01, DEVICE_TAGS, DEVICE_TAGS_TEXT, FEATURE, SESSION_LOG, SESSION_LOG_TEXT, buildChange, withFiles } from "./support/harness.ts";
import { EXAMPLE_ROOT, snapshotFromDisk } from "./support/snapshot_from_disk.ts";

const TAGS_CHANGE = `---
id: 01-tags
title: Tags on devices
---

# Change: Tags on devices

## Scope

- Delivers: SCN-inventory.list-by-tag
- Builds: ENT-inventory.device

## Test plan

| Subject | Seam | Test file | Kind |
| --- | --- | --- | --- |
| SCN-inventory.list-by-tag | UC-inventory.list-devices with a fake PORT-inventory.device-catalog | \`tests/inventory_list_devices.rs\` | behaviour |

## Tasks

- T1: \`Device\` in \`src/inventory/domain/device.rs\`, proves ENT-inventory.device
- T2: \`ListDevices\` tag filter in \`src/inventory/app/list_devices.rs\`, proves SCN-inventory.list-by-tag
`;

const stateOf = async (h: Awaited<ReturnType<typeof withFiles>>, ref: string) =>
  (await showStatus(h.deps)).features.find((f) => f.ref === ref)?.approval;

describe("three features in flight at once, from init to land", () => {
  it("keeps approvals current unless an element they cite changed", async () => {
    const h = await withFiles(new MemoryProjectFiles());
    await initProject({ files: h.files, bundle: h.deps.bundle, prompter: new ScriptedPrompter() }, { name: "Console Access", defaultName: "x", agents: [] });
    for (const [path, text] of snapshotFromDisk(EXAMPLE_ROOT)) if (path !== ".cruze/config.yaml") h.files.files.set(path, text);
    h.files.files.set(`.cruze/features/${DEVICE_TAGS}/feature.md`, DEVICE_TAGS_TEXT);
    h.files.files.set(`.cruze/features/${SESSION_LOG}/feature.md`, SESSION_LOG_TEXT);
    assert.deepEqual((await validate(h.deps)).problems, []);

    for (const ref of ["vision", "architecture", "roadmap", FEATURE, DEVICE_TAGS, SESSION_LOG]) await approveArtifact(h.deps, ref);

    // open-console lands first. It modifies the console session, which session-log also modifies.
    await buildChange(h, CHANGE_01, BRANCH_01);
    await landChange(h.deps, CHANGE_01);
    assert.equal((await stateOf(h, DEVICE_TAGS))?.state, "approved");
    const sessionLog = await stateOf(h, SESSION_LOG);
    assert.equal(sessionLog?.state, "upstream-changed");
    assert.deepEqual(sessionLog?.changed, ["ENT-access.console-session"]);

    // device-tags lands second and finishes. Nothing open-console cites changes.
    h.files.files.set(`.cruze/features/${DEVICE_TAGS}/changes/01-tags/change.md`, TAGS_CHANGE);
    h.repository.branch = "main";
    await approveArtifact(h.deps, DEVICE_TAGS);
    await buildChange(h, `${DEVICE_TAGS}/01-tags`, "device-tags");
    const landed = await landChange(h.deps, `${DEVICE_TAGS}/01-tags`);
    assert.equal(landed.finished, true);
    assert.equal((await stateOf(h, FEATURE))?.state, "approved");
    assert.deepEqual((await showStatus(h.deps)).documents.map((d) => d.state), ["approved", "approved", "approved"]);
    assert.match(h.files.files.get("docs/specs/inventory.md") ?? "", /### SCN-inventory\.list-by-tag: List devices with one tag\n(- .*\n)+- Status: built/);
    assert.deepEqual((await validate(h.deps)).problems, []);
  });
});
