import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { findOverlaps } from "../src/app/use_cases/project_status.ts";
import { BRANCH_01, CHANGE_01, DEVICE_TAGS, DEVICE_TAGS_TEXT, SESSION_LOG, SESSION_LOG_TEXT, exampleProject, type Harness } from "./support/harness.ts";

/** A change bound to a branch, as plan leaves it. */
function boundChange(id: string, branch: string, builds: string, seam: string, landed = ""): string {
  return `---
id: ${id}
title: ${id}
---

# Change: ${id}

## Scope

- Builds: ${builds}

## Test plan

| Subject | Seam | Test file | Kind |
| --- | --- | --- | --- |
| ${builds} | ${seam} | \`tests/${id}.rs\` | behaviour |

## Tasks

- T1: \`Thing\` in \`src/thing.rs\`, proves ${builds}

<!-- cruze:managed -->
## Progress
- Branch: ${branch}
- [ ] T1${landed === "" ? "" : `\n- Landed: ${landed}`}
<!-- /cruze:managed -->
`;
}

/** Puts a branch in the fake repository: this branch's .cruze files plus the given ones. */
function branchWith(h: Harness, branch: string, files: Record<string, string>): void {
  const cruze = [...h.files.files].filter(([path]) => path.startsWith(".cruze/"));
  h.repository.branches.set(branch, new Map([...cruze, ...Object.entries(files)]));
}

/** session-log's change modifies the console session, which open-console's first change builds. */
function sessionLogBranch(h: Harness): void {
  branchWith(h, "session-log", {
    [`.cruze/features/${SESSION_LOG}/feature.md`]: SESSION_LOG_TEXT,
    [`.cruze/features/${SESSION_LOG}/changes/01-record/change.md`]: boundChange("01-record", "session-log", "ENT-access.console-session", "ENT-access.console-session state transitions"),
  });
}

describe("finding work on other branches that overlaps this branch's change", () => {
  it("reports a change that builds an element this change builds", async () => {
    const h = await exampleProject();
    h.repository.branch = BRANCH_01;
    sessionLogBranch(h);
    const report = await findOverlaps(h.deps);
    assert.equal(report.change, CHANGE_01);
    assert.deepEqual(report.overlaps, [{ branch: "session-log", item: `${SESSION_LOG}/01-record`, shared: ["ENT-access.console-session"] }]);
  });

  // A project's overlap check counted an element its change only named as a test seam.
  it("ignores an element the other change only names as a test seam", async () => {
    const h = await exampleProject();
    h.repository.branch = BRANCH_01;
    branchWith(h, "device-tags", {
      [`.cruze/features/${DEVICE_TAGS}/feature.md`]: DEVICE_TAGS_TEXT,
      [`.cruze/features/${DEVICE_TAGS}/changes/01-tags/change.md`]: boundChange("01-tags", "device-tags", "ENT-inventory.device", "ADP-system.cli, the binary run with a tagged `devices.toml`"),
    });
    assert.deepEqual((await findOverlaps(h.deps)).overlaps, []);
  });

  // A project's overlap check reported a branch whose change had already merged and been archived.
  it("ignores a change that has landed on this branch, even though its old branch still binds it", async () => {
    const h = await exampleProject();
    h.repository.branch = BRANCH_01;
    sessionLogBranch(h);
    h.files.files.set(`.cruze/archive/${SESSION_LOG}/feature.md`, SESSION_LOG_TEXT);
    h.files.files.set(`.cruze/archive/${SESSION_LOG}/changes/01-record/change.md`, boundChange("01-record", "session-log", "ENT-access.console-session", "ENT-access.console-session state transitions"));
    assert.deepEqual((await findOverlaps(h.deps)).overlaps, []);
  });

  it("ignores a change that has landed, while its feature is still in progress", async () => {
    const h = await exampleProject();
    h.repository.branch = BRANCH_01;
    branchWith(h, "session-log", {
      [`.cruze/features/${SESSION_LOG}/feature.md`]: SESSION_LOG_TEXT,
      [`.cruze/features/${SESSION_LOG}/changes/01-record/change.md`]: boundChange("01-record", "session-log", "ENT-access.console-session", "ENT-access.console-session state transitions", "2026-09-29 (abc1234)"),
    });
    assert.deepEqual((await findOverlaps(h.deps)).overlaps, []);
  });
});
