import { parse as parseYaml } from "yaml";

/** `.cruze/config.yaml`, as described in the cruze-formats skill. */
export interface CruzeConfig {
  version: 1;
  project: string;
  tracker: "markdown";
  source: string[];
  tests: string[];
  check: {
    maxLines: number;
    maxTypes: number;
    exceptions: Array<{ path: string; reason: string }>;
  };
  layers: Layer[];
}

export interface Layer {
  name: string;
  paths: string[];
  mayImport: string[];
}

export type ConfigResult = { config: CruzeConfig; problems: string[] } | { config: null; problems: string[] };

/** Parses the config, collecting every problem; returns a config only when it is usable. */
export function parseConfig(text: string): ConfigResult {
  let raw: unknown;
  try {
    raw = parseYaml(text);
  } catch (error) {
    return { config: null, problems: [`not valid YAML: ${error instanceof Error ? error.message : String(error)}`] };
  }
  const problems: string[] = [];
  const root = asRecord(raw);
  if (root === null) return { config: null, problems: ["the file must be a YAML mapping"] };

  if (root["version"] !== 1) problems.push("version must be 1");
  if (typeof root["project"] !== "string" || root["project"] === "") problems.push("project must be a non-empty string");
  if (root["tracker"] !== "markdown") problems.push("tracker must be markdown");
  const source = stringList(root["source"], "source", problems);
  const tests = stringList(root["tests"], "tests", problems);

  const check = asRecord(root["check"]) ?? {};
  const maxLines = positiveInt(check["max_lines"], "check.max_lines", problems);
  const maxTypes = positiveInt(check["max_types"], "check.max_types", problems);
  const exceptions = (Array.isArray(check["exceptions"]) ? check["exceptions"] : []).flatMap((entry: unknown, i: number) => {
    const record = asRecord(entry);
    if (typeof record?.["path"] !== "string" || typeof record["reason"] !== "string" || record["reason"].trim() === "") {
      problems.push(`check.exceptions[${i}] needs a path and a non-empty reason`);
      return [];
    }
    return [{ path: record["path"], reason: record["reason"] }];
  });

  const layers = (Array.isArray(root["layers"]) ? root["layers"] : []).flatMap((entry: unknown, i: number) => {
    const record = asRecord(entry);
    if (typeof record?.["name"] !== "string") {
      problems.push(`layers[${i}] needs a name`);
      return [];
    }
    return [{ name: record["name"], paths: stringList(record["paths"], `layers[${i}].paths`, problems), mayImport: stringList(record["may_import"], `layers[${i}].may_import`, problems) }];
  });
  const names = layers.map((layer) => layer.name);
  names.filter((name, i) => names.indexOf(name) !== i).forEach((name) => problems.push(`layer ${name} is defined twice`));
  for (const layer of layers) {
    for (const target of layer.mayImport.filter((t) => !names.includes(t))) {
      problems.push(`layer ${layer.name} may_import names unknown layer ${target}`);
    }
  }

  const config: CruzeConfig = {
    version: 1,
    project: typeof root["project"] === "string" ? root["project"] : "",
    tracker: "markdown",
    source,
    tests,
    check: { maxLines: maxLines ?? 250, maxTypes: maxTypes ?? 5, exceptions },
    layers,
  };
  return { config, problems };
}

/** The first layer whose paths match the file, as the formats define. */
export function layerOf(config: CruzeConfig, path: string, matches: (path: string, globs: string[]) => boolean): Layer | undefined {
  return config.layers.find((layer) => matches(path, layer.paths));
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function stringList(value: unknown, key: string, problems: string[]): string[] {
  if (value === undefined || value === null) return [];
  if (Array.isArray(value) && value.every((item) => typeof item === "string")) return value as string[];
  problems.push(`${key} must be a list of strings`);
  return [];
}

function positiveInt(value: unknown, key: string, problems: string[]): number | undefined {
  if (value === undefined) return undefined;
  if (typeof value === "number" && Number.isInteger(value) && value > 0) return value;
  problems.push(`${key} must be a positive whole number`);
  return undefined;
}
