import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { approveDocument } from "../src/app/use_cases/approve_document.ts";
import { createDocument } from "../src/app/use_cases/new_document.ts";
import { showStatus, suggestNext } from "../src/app/use_cases/project_status.ts";
import { ARCHITECTURE, OPEN_SERIAL, VISION, approveEnvision, edit, exampleProject } from "./support/harness.ts";

describe("choosing the next step", () => {
  it("sends a project to envision until its vision and architecture map are both approved", async () => {
    const h = await exampleProject();
    const architecture = h.files.files.get(ARCHITECTURE) ?? "";
    h.files.files.delete(ARCHITECTURE);
    assert.deepEqual(await suggestNext(h.deps), { step: "envision", reason: "the vision isn't approved as it stands" });
    await approveDocument(h.deps, "vision");
    assert.equal((await suggestNext(h.deps)).reason, "the project has no architecture map yet");
    h.files.files.set(ARCHITECTURE, architecture);
    assert.equal((await suggestNext(h.deps)).reason, "the architecture map isn't approved as it stands");
    await approveDocument(h.deps, "architecture");
    assert.notEqual((await suggestNext(h.deps)).step, "envision");
    edit(h.files, VISION, "Windows support", "Windows or BSD support");
    assert.equal((await suggestNext(h.deps)).step, "envision");
  });

  it("finishes a shaped feature before starting the next: approval first, then build", async () => {
    const h = await exampleProject();
    await approveEnvision(h.deps);
    assert.deepEqual(await suggestNext(h.deps), { step: "shape", target: "open-serial", reason: "open-serial is shaped but not approved" });
    await approveDocument(h.deps, "open-serial");
    assert.deepEqual(await suggestNext(h.deps), { step: "build", target: "open-serial", reason: "open-serial is approved and not built" });
    edit(h.files, OPEN_SERIAL, "Connected to r1", "Attached to r1");
    assert.equal((await suggestNext(h.deps)).step, "shape");
  });

  it("shapes the first release feature whose needs are all built, in release order", async () => {
    const h = await exampleProject();
    await approveEnvision(h.deps);
    await approveDocument(h.deps, "open-serial");
    edit(h.files, OPEN_SERIAL, "- Status: shaped", "- Status: built");
    assert.deepEqual(await suggestNext(h.deps), { step: "shape", target: "ssh-hops", reason: "ssh-hops is next in the release, and everything it needs is built" });
  });

  it("skips a feature whose needs aren't built yet", async () => {
    const h = await exampleProject();
    await approveEnvision(h.deps);
    edit(h.files, VISION, "| ssh-hops | Reach a console through a chain of SSH hosts | open-serial |", "| ssh-hops | Reach a console through a chain of SSH hosts | run-commands |");
    edit(h.files, VISION, "| run-commands | Run one command on a device and get its output as JSON | open-serial |", "| run-commands | Run one command on a device and get its output as JSON | |");
    await approveDocument(h.deps, "vision");
    h.files.files.delete(OPEN_SERIAL);
    const next = await suggestNext(h.deps);
    assert.deepEqual(next, { step: "shape", target: "open-serial", reason: "open-serial is next in the release, and everything it needs is built" });
    await createDocument(h.deps, "feature", "open-serial");
    h.files.files.set(OPEN_SERIAL, (h.files.files.get(OPEN_SERIAL) ?? "").replace("- Status: shaped", "- Status: built"));
    assert.equal((await suggestNext(h.deps)).target, "run-commands");
  });

  it("holds a feature in progress while a piece split out of it isn't built, and shapes that piece first", async () => {
    const h = await exampleProject();
    edit(h.files, VISION, "| open-serial | Open an interactive console on a device's local serial port | list-devices |", "| serial-kit | Talk to a serial port | list-devices |\n| open-serial | Open an interactive console on a device's local serial port | list-devices, serial-kit |");
    await approveEnvision(h.deps);
    await approveDocument(h.deps, "open-serial");
    assert.deepEqual(await suggestNext(h.deps), { step: "shape", target: "serial-kit", reason: "serial-kit is next in the release, and everything it needs is built" });
    await createDocument(h.deps, "feature", "serial-kit");
    assert.deepEqual(await suggestNext(h.deps), { step: "shape", target: "serial-kit", reason: "serial-kit is shaped but not approved" });
    edit(h.files, "docs/features/serial-kit.md", "- Status: shaped", "- Status: built");
    assert.deepEqual(await suggestNext(h.deps), { step: "build", target: "open-serial", reason: "open-serial is approved and not built" });
  });

  it("asks envision for the next release once every release feature is built", async () => {
    const h = await exampleProject();
    await approveEnvision(h.deps);
    for (const slug of ["open-serial", "ssh-hops", "run-commands"]) {
      h.files.files.set(`docs/features/${slug}.md`, `# ${slug}\n\n- Status: built\n`);
    }
    assert.deepEqual(await suggestNext(h.deps), { step: "envision", reason: "every release feature is built; plan the next release" });
  });

  it("reports each feature's progress in release order, with its needs", async () => {
    const h = await exampleProject();
    const status = await showStatus(h.deps);
    assert.deepEqual(status.features.map((f) => [f.slug, f.status, f.needs.join(",")]), [
      ["list-devices", "built", ""],
      ["open-serial", "shaped", "list-devices"],
      ["ssh-hops", "not-shaped", "open-serial"],
      ["run-commands", "not-shaped", "open-serial"],
    ]);
  });
});
