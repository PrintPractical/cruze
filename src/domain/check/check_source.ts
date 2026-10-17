import type { CruzeConfig, Layer } from "../config.ts";
import { matchesAny } from "../glob.ts";
import { budgetedText } from "./budget_text.ts";
import { importsOf, resolveImport } from "./imports.ts";
import { countTypes } from "./type_count.ts";

export interface CheckFinding {
  path: string;
  line?: number;
  rule: "layer" | "max-lines" | "max-types" | "no-layer" | "test-placement";
  message: string;
  /** Layer violations always fail; the rest fail in CI unless excepted. */
  severity: "error" | "warning";
}

export interface CheckInput {
  config: CruzeConfig;
  /** Every source file matched by config.source, by path. */
  sources: ReadonlyMap<string, string>;
  /** Check only these files, when given; imports still resolve against every source. */
  only?: string[];
}

/** Enforces the architecture's layer rules and the file budgets on source code. */
export function checkSource(input: CheckInput): CheckFinding[] {
  const { config, sources } = input;
  const all = [...sources.keys()];
  const targets = input.only ?? all;
  const layerOf = (path: string): Layer | undefined => config.layers.find((layer) => matchesAny(path, layer.paths));
  const findings: CheckFinding[] = [];

  for (const path of targets) {
    const text = sources.get(path);
    if (text === undefined) continue;
    const layer = layerOf(path);
    if (config.layers.length > 0 && layer === undefined) {
      findings.push({ path, rule: "no-layer", severity: "warning", message: "the file is in no layer, so its imports are unchecked" });
    }
    if (layer !== undefined) {
      for (const found of importsOf(path, text)) {
        const target = resolveImport(found, all);
        const targetLayer = target === undefined ? undefined : layerOf(target);
        if (target === undefined || targetLayer === undefined || targetLayer.name === layer.name) continue;
        if (!layer.mayImport.includes(targetLayer.name)) {
          findings.push({ path, line: found.line + 1, rule: "layer", severity: "error", message: `${layer.name} may not import ${targetLayer.name} (${target})` });
        }
      }
    }
    const excepted = config.check.exceptions.some((exception) => exception.path === path);
    const budgeted = budgetedText(path, text);
    const lines = budgeted.split("\n").length - (budgeted.endsWith("\n") ? 1 : 0);
    if (!excepted && lines > config.check.maxLines) {
      const measured = budgeted === text ? "" : ", not counting its inline tests";
      findings.push({ path, rule: "max-lines", severity: "warning", message: `${lines} lines${measured}, over the budget of ${config.check.maxLines}; split it if it holds a second responsibility, or list it under check.exceptions` });
    }
    const types = countTypes(path, budgeted);
    if (!excepted && types !== null && types > config.check.maxTypes) {
      findings.push({ path, rule: "max-types", severity: "warning", message: `${types} top-level types, over the budget of ${config.check.maxTypes}; split it if it holds a second responsibility, or list it under check.exceptions` });
    }
    if (!excepted && isRustTestFileInSource(path)) {
      findings.push({ path, rule: "test-placement", severity: "warning", message: "Rust tests that leave their inline module go in the crate's tests/ directory, not under src/" });
    }
  }
  return findings;
}

/** A Rust file of tests split out of a module: `tests.rs`, `*_tests.rs`, or anything under a `tests/` folder inside `src/`. */
function isRustTestFileInSource(path: string): boolean {
  if (!path.endsWith(".rs")) return false;
  const segments = path.split("/");
  const inSource = segments.lastIndexOf("src");
  if (inSource === -1) return false;
  const below = segments.slice(inSource + 1);
  const file = below.at(-1) ?? "";
  return file === "tests.rs" || file.endsWith("_tests.rs") || below.slice(0, -1).includes("tests");
}
