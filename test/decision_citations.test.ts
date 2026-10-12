import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { approveArtifact } from "../src/app/use_cases/approve_artifact.ts";
import { checkCode } from "../src/app/use_cases/check_code.ts";
import { validate } from "../src/app/use_cases/validate_project.ts";
import { findDecisionCitations, workItemSlugs } from "../src/domain/decision_citations.ts";
import { FEATURE, FEATURE_PATH, edit, exampleProject, setVersions, type Harness } from "./support/harness.ts";

const ARCHITECTURE = "docs/architecture.md";
const PROJECT_DECISIONS = "- ADR-2026-09-24-hop-chains: console paths are ordered hop chains, each hop connected over the previous link, instead of delegating to OpenSSH `ProxyJump`\n";

/** Gives the architecture project decisions D2 and D5; the open-console feature defines D1 to D3. */
function addProjectDecisions(h: Harness): void {
  edit(h.files, ARCHITECTURE, PROJECT_DECISIONS, `${PROJECT_DECISIONS}- D2: Devices are named in lowercase (shell-friendly)\n- D5: The CLI never prompts (scripts run it)\n`);
}

async function citationProblems(h: Harness): Promise<Array<[string, string]>> {
  return (await validate(h.deps)).problems.filter((p) => p.rule === "decision-citation").map((p) => [p.path, p.message]);
}

// Ork: 347 citations such as "(events D17)" in its architecture pointed into archived features.
describe("citing decisions by number in the living docs", () => {
  it("warns when the architecture cites a work item's decision, or one its own Decisions don't define", async () => {
    const h = await exampleProject();
    addProjectDecisions(h);
    edit(h.files, ARCHITECTURE, "  - links are closed in the reverse order they were opened\n", "  - links are closed in the reverse order they were opened (open-console D2, D3)\n  - a closed session never reopens (D5)\n  - it holds one link per hop (D9)\n");
    const problems = await citationProblems(h);
    assert.equal(problems.length, 2);
    assert.match(problems[0]?.[1] ?? "", /^cites open-console D2, D3, a decision of open-console, which the living docs don't hold/);
    assert.match(problems[1]?.[1] ?? "", /^cites D9, which "## Decisions" doesn't define/);
  });

  it("warns when a spec cites a decision by number, since only the architecture numbers its own", async () => {
    const h = await exampleProject();
    addProjectDecisions(h);
    edit(h.files, "docs/specs/inventory.md", "The CLI SHALL list every", "The CLI SHALL list (D2) every");
    assert.deepEqual((await citationProblems(h)).map(([path]) => path), ["docs/specs/inventory.md"]);
  });

  it("names a change cited after its decision, and leaves words that only look like one alone", () => {
    const slugs = workItemSlugs(["2026-10-10-network-orchestrator", "02-links"]);
    const citations = findDecisionCitations(["recovers (D16 of 02-links), see `D3` and D3D11", "- D4: defined here, unlike network-orchestrator D45"], slugs);
    assert.deepEqual(citations.map((c) => [c.text, c.qualifier]), [["D16 of 02-links", "02-links"], ["network-orchestrator D45", "network-orchestrator"]]);
  });
});

describe("citing decisions by number in a delta", () => {
  it("warns on an element that cites the work's own decision, and approval refuses the work", async () => {
    const h = await exampleProject();
    edit(h.files, FEATURE_PATH, "  - in `armed`, `q` means detach;", "  - in `armed`, `q` means detach (D1);");
    assert.deepEqual(await citationProblems(h), [[FEATURE_PATH, "ENT-access.escape-detector cites D1, which won't mean the same in the living docs once this delta merges; write what it decided into this text, or cite the ADR that records it"]]);
    for (const ref of ["vision", "architecture", "roadmap"]) await approveArtifact(h.deps, ref);
    await assert.rejects(approveArtifact(h.deps, FEATURE), (e: Error & { code?: string }) => e.code === "decision-cited");
  });

  it("lets an element cite a project decision the work doesn't renumber, or one the living element already cites", async () => {
    const h = await exampleProject();
    addProjectDecisions(h);
    edit(h.files, ARCHITECTURE, "  - links are closed in the reverse order they were opened\n", "  - links are closed in the reverse order they were opened (D2)\n");
    edit(h.files, FEATURE_PATH, "  - in `armed`, `q` means detach;", "  - in `armed`, `q` means detach (D5, D2);");
    edit(h.files, FEATURE_PATH, "  - input reaches the last link only while the session is `open`\n", "  - input reaches the last link only while the session is `open` (D2)\n");
    assert.deepEqual((await citationProblems(h)).map(([, message]) => message.slice(0, message.indexOf(","))), ["ENT-access.escape-detector cites D5"]);
  });
});

describe("citing decisions by number in code", () => {
  it("warns on a comment in a source or test file that cites a decision, pending until the project realigns", async () => {
    const h = await exampleProject();
    h.files.files.set("src/access/domain/escape_detector.rs", "/// Holds back `Ctrl-]` (open-console D1).\npub struct EscapeDetector { d1: u8 }\nconst D2: u8 = 2;\n");
    h.files.files.set("tests/access_open_console.rs", "// Each hop gets its own timeout\n// (D2).\n");
    const findings = async () => (await checkCode(h.deps, { ci: true })).findings.filter((f) => f.rule === "decision-citation");
    setVersions(h.files, { standards: "0.0.9" });
    assert.deepEqual((await findings()).map((f) => [f.path, f.line, f.pending]), [["src/access/domain/escape_detector.rs", 1, true], ["tests/access_open_console.rs", 2, true]]);
    setVersions(h.files, { standards: "0.0.10" });
    assert.deepEqual((await findings()).map((f) => f.pending), [undefined, undefined]);
  });
});
