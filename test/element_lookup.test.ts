import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { showElements, showIndex } from "../src/app/use_cases/show_elements.ts";
import { CruzeError } from "../src/domain/cruze_error.ts";
import { FEATURE, exampleProject } from "./support/harness.ts";

const rejectsWith = (code: string) => (e: unknown): boolean => e instanceof CruzeError && e.code === code;

// Ork: one architect run read all 52k words of the architecture to find the few elements it would extend.
describe("finding elements without reading whole documents", () => {
  it("indexes every element of the architecture and specs on one line each, with what work in flight changes", async () => {
    const { deps } = await exampleProject();
    const index = await showIndex(deps);
    const entry = (id: string) => index.entries.find((e) => e.id === id);
    assert.deepEqual(entry("ENT-access.console-session"), {
      id: "ENT-access.console-session",
      title: "Console session",
      kind: "ENT",
      source: "docs/architecture.md",
      status: "planned",
      place: "MOD-access.domain",
      changedBy: [FEATURE],
    });
    assert.equal(entry("MOD-access.adapters")?.place, "`src/access/adapters/`");
    assert.equal(entry("REQ-inventory.list-devices")?.scenarios, 2);
    assert.equal(index.entries.some((e) => e.kind === "SCN"), false, "scenarios are counted under their requirement");
    assert.equal(entry("ENT-access.escape-detector")?.addedBy, FEATURE);
    assert.ok(index.words.architecture > 1000 && index.words.specs > 100);
  });

  it("lists one context or capability in full, scenarios included", async () => {
    const { deps } = await exampleProject();
    const index = await showIndex(deps, "inventory");
    assert.ok(index.entries.every((e) => e.id === "CTX-inventory" || e.id.split("-").slice(1).join("-").startsWith("inventory.")));
    assert.ok(index.entries.some((e) => e.id === "CTX-inventory"));
    assert.ok(index.entries.some((e) => e.kind === "SCN"));
    await assert.rejects(showIndex(deps, "billing"), rejectsWith("unknown-scope"));
  });

  it("shows an element's living body beside each in-flight delta that changes it, and one only a delta defines", async () => {
    const { deps } = await exampleProject();
    const { elements } = await showElements(deps, ["ENT-access.console-session", "ENT-access.escape-detector"]);
    assert.deepEqual(elements.map((e) => [e.id, e.source.replace(/:\d+$/, ""), e.op]), [
      ["ENT-access.console-session", "docs/architecture.md", undefined],
      ["ENT-access.console-session", `.cruze/features/${FEATURE}/feature.md`, "MODIFIED"],
      ["ENT-access.escape-detector", `.cruze/features/${FEATURE}/feature.md`, "ADDED"],
    ]);
    assert.match(elements[0]?.body.join("\n") ?? "", /^### ENT-access\.console-session: Console session\n- Kind: entity/);
    await assert.rejects(showElements(deps, ["ENT-access.console-sesion"]), (e: unknown) => rejectsWith("unknown-id")(e) && /cruze show --index/.test((e as Error).message));
  });
});
