import assert from "node:assert/strict";
import { PackageBundle } from "../../src/adapters/outbound/package_bundle.ts";
import type { ProjectDeps } from "../../src/app/project_context.ts";
import { approveDocument } from "../../src/app/use_cases/approve_document.ts";
import { FakeRepository, SteppingClock } from "../fakes/fake_repository.ts";
import { MemoryProjectFiles } from "../fakes/memory_project_files.ts";
import { EXAMPLE_ROOT, snapshotFromDisk } from "./snapshot_from_disk.ts";

export const VISION = "docs/vision.md";
export const ARCHITECTURE = "docs/architecture.md";
export const OPEN_SERIAL = "docs/features/open-serial.md";

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

/** Approves the vision and the architecture map, as envision ends. */
export async function approveEnvision(deps: ProjectDeps): Promise<void> {
  for (const ref of ["vision", "architecture"]) await approveDocument(deps, ref);
}

/** Sets the fixture's recorded Cruze version, so a test doesn't depend on the release it runs in. */
export function setVersion(files: MemoryProjectFiles, version: string | null): void {
  const text = files.files.get(".cruze/config.yaml") ?? "";
  assert.ok(/^cruze: .*\n/m.test(text), "the fixture's config has no cruze: line");
  files.files.set(".cruze/config.yaml", text.replace(/^cruze: .*\n/m, version === null ? "" : `cruze: "${version}"\n`));
}

/** Replaces text in a file, failing the test when the text isn't there. */
export function edit(files: MemoryProjectFiles, path: string, from: string, to: string): void {
  const text = files.files.get(path) ?? "";
  assert.ok(text.includes(from), `${path} does not contain "${from}"`);
  files.files.set(path, text.replace(from, to));
}
