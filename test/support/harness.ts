import assert from "node:assert/strict";
import { PackageBundle } from "../../src/adapters/outbound/package_bundle.ts";
import type { ProjectDeps } from "../../src/app/project_context.ts";
import { approveArtifact } from "../../src/app/use_cases/approve_artifact.ts";
import { completeTask } from "../../src/app/use_cases/record_progress.ts";
import { FakeRepository, SteppingClock } from "../fakes/fake_repository.ts";
import { MemoryProjectFiles } from "../fakes/memory_project_files.ts";
import { EXAMPLE_ROOT, snapshotFromDisk } from "./snapshot_from_disk.ts";

export const FEATURE = "2026-09-25-open-console";
export const FEATURE_PATH = `.cruze/features/${FEATURE}/feature.md`;
export const CHANGE_01 = `${FEATURE}/01-local-serial`;
export const CHANGE_01_PATH = `.cruze/features/${FEATURE}/changes/01-local-serial/change.md`;
export const CHANGE_02 = `${FEATURE}/02-ssh-hops`;
export const BRANCH_01 = "open-console-local-serial";

export interface Harness {
  files: MemoryProjectFiles;
  repository: FakeRepository;
  deps: ProjectDeps;
}

/** An in-memory copy of the worked example, with the real bundle and a fake git repository. */
export async function exampleProject(): Promise<Harness> {
  const files = new MemoryProjectFiles(Object.fromEntries(snapshotFromDisk(EXAMPLE_ROOT)));
  return withFiles(files);
}

export async function withFiles(files: MemoryProjectFiles): Promise<Harness> {
  const repository = new FakeRepository();
  const deps: ProjectDeps = { files, repository, clock: new SteppingClock(), bundle: await PackageBundle.locate() };
  return { files, repository, deps };
}

/** Approves the vision, architecture, roadmap and the open-console feature, in that order. */
export async function approveDesign(deps: ProjectDeps): Promise<void> {
  for (const ref of ["vision", "architecture", "roadmap", FEATURE]) await approveArtifact(deps, ref);
}

/** Approves a change on its branch, as plan would, and completes every task. */
export async function buildChange(h: Harness, ref: string, branch: string): Promise<void> {
  h.repository.branch = branch;
  await approveArtifact(h.deps, ref);
  const text = h.files.files.get(pathOf(ref)) ?? "";
  for (const task of text.matchAll(/^- (T\d+): /gm)) await completeTask(h.deps, task[1] ?? "", { change: ref });
}

export function pathOf(ref: string): string {
  const [feature, change] = ref.split("/");
  return change === undefined ? `.cruze/changes/${feature}/change.md` : `.cruze/features/${feature}/changes/${change}/change.md`;
}

/** Replaces text in a file, failing the test when the text isn't there. */
export function edit(files: MemoryProjectFiles, path: string, from: string, to: string): void {
  const text = files.files.get(path) ?? "";
  assert.ok(text.includes(from), `${path} does not contain "${from}"`);
  files.files.set(path, text.replace(from, to));
}

export const CHANGE_02_TEXT = `---
id: 02-ssh-hops
title: Consoles over SSH hops
---

# Change: Consoles over SSH hops

## Scope

- Delivers: SCN-access.ssh-direct, SCN-access.ssh-through-jump-host, SCN-access.second-hop-refused
- Builds: ADP-access.ssh-connector, FLOW-access.hop-failure

## Test plan

| Subject | Seam | Test file | Kind |
| --- | --- | --- | --- |
| SCN-access.ssh-direct | UC-access.open-console with ADP-access.ssh-connector against a test SSH server | \`tests/access_ssh.rs\` | behaviour |
| SCN-access.ssh-through-jump-host | the same, with two test servers | \`tests/access_ssh.rs\` | behaviour |
| SCN-access.second-hop-refused | the same, with the second server refusing | \`tests/access_ssh.rs\` | behaviour |
| PORT-access.hop-connector | ADP-access.ssh-connector and the fake, against a test SSH server | \`tests/contract_hop_connector.rs\` | contract |
| FLOW-access.hop-failure | \`consolectl open\` against test servers | \`tests/cli_open_ssh.rs\` | smoke |

## Tasks

- T1: \`SshConnector\` in \`src/access/adapters/ssh_connector.rs\`, proves ADP-access.ssh-connector, SCN-access.ssh-direct, SCN-access.ssh-through-jump-host
- T2: \`OpenConsole\` failure unwinding in \`src/access/app/open_console.rs\`, proves FLOW-access.hop-failure, SCN-access.second-hop-refused
`;

/** A feature that cites only inventory elements the open-console feature never touches. */
export const DEVICE_TAGS = "2026-09-26-device-tags";
export const DEVICE_TAGS_TEXT = `---
id: ${DEVICE_TAGS}
title: Device tags
---

# Feature: Device tags

## Intent

Group devices with tags, so \`consolectl list --tag lab\` shows a subset.

## Spec delta

### ADDED REQ-inventory.filter-by-tag: Filter devices by tag
The CLI SHALL list only the devices carrying a tag when the user passes \`--tag\`.

#### SCN-inventory.list-by-tag: List devices with one tag
- GIVEN \`lab-router\` has tag \`lab\` and \`core-switch\` has none
- WHEN the user runs \`consolectl list --tag lab\`
- THEN the output has one line, for \`lab-router\`

## Architecture delta

### MODIFIED ENT-inventory.device: Device
- Kind: entity
- Invariants:
  - the name is 1 to 64 characters of lowercase letters, digits and hyphens
  - a device has at most 16 tags, each a lowercase word
- Relationships:
  - reached by ENT-inventory.console-path (1)
- Module: MOD-inventory.domain
- File: \`src/inventory/domain/device.rs\`

## Changes

| Change | Delivers | Builds | Depends on |
| --- | --- | --- | --- |
| 01-tags | SCN-inventory.list-by-tag | ENT-inventory.device | |
`;

/** A feature that modifies the console session, which open-console also modifies. */
export const SESSION_LOG = "2026-09-26-session-log";
export const SESSION_LOG_TEXT = `---
id: ${SESSION_LOG}
title: Session log
---

# Feature: Session log

## Intent

Record everything a console session shows to a file.

## Spec delta

### ADDED CAPABILITY logging: Session logging
Recording console sessions to files.

### ADDED REQ-logging.record-session: Record a session
The CLI SHALL write every byte a console session shows to the file named by \`--log\`.

#### SCN-logging.log-file: Session written to a log file
- GIVEN a console session on \`lab-router\` opened with \`--log /tmp/lab.log\`
- WHEN the device prints \`lab-router login: \`
- THEN \`/tmp/lab.log\` ends with \`lab-router login: \`

## Architecture delta

### MODIFIED ENT-access.console-session: Console session
- Kind: entity
- States: \`opening\` to \`open\` to \`closed\`, or to \`failed\` from either
- Invariants:
  - links are closed in the reverse order they were opened
  - every byte shown to the user is also recorded when a log is attached
- Relationships:
  - opens ENT-inventory.console-path (1)
- Module: MOD-access.domain
- File: \`src/access/domain/console_session.rs\`

## Changes

| Change | Delivers | Builds | Depends on |
| --- | --- | --- | --- |
| 01-record | SCN-logging.log-file | ENT-access.console-session | |
`;
