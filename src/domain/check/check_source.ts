import type { CruzeConfig, Layer } from "../config.ts";
import { matchesAny } from "../glob.ts";
import { importsOf, resolveImport } from "./imports.ts";
import { countTypes } from "./type_count.ts";

export interface CheckFinding {
  path: string;
  line?: number;
  rule: "layer" | "max-lines" | "max-types" | "outside-module-map" | "no-layer";
  message: string;
  /** Layer violations always fail; the rest fail in CI unless excepted. */
  severity: "error" | "warning";
}

export interface CheckInput {
  config: CruzeConfig;
  /** Every source file matched by config.source, by path. */
  sources: ReadonlyMap<string, string>;
  /** Paths of the MOD elements in the architecture; files outside all of them are flagged. */
  modulePaths: string[];
  /** Check only these files, when given; imports still resolve against every source. */
  only?: string[];
}

/** Enforces the architecture's layer rules and the file budgets on source code. */
export function checkSource(input: CheckInput): CheckFinding[] {
  const { config, sources, modulePaths } = input;
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
    const lines = text.split("\n").length - (text.endsWith("\n") ? 1 : 0);
    if (!excepted && lines > config.check.maxLines) {
      findings.push({ path, rule: "max-lines", severity: "warning", message: `${lines} lines, over the budget of ${config.check.maxLines}; split it by responsibility` });
    }
    const types = countTypes(path, text);
    if (!excepted && types !== null && types > config.check.maxTypes) {
      findings.push({ path, rule: "max-types", severity: "warning", message: `${types} top-level types, over the budget of ${config.check.maxTypes}` });
    }
    if (modulePaths.length > 0 && !modulePaths.some((module) => (module.endsWith("/") ? path.startsWith(module) : path === module))) {
      findings.push({ path, rule: "outside-module-map", severity: "warning", message: "the file is outside every module in the architecture's module map" });
    }
  }
  return findings;
}
