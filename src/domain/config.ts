import { parse as parseYaml } from "yaml";

/** `.cruze/config.yaml`, as described in the cruze-formats skill. */
export interface CruzeConfig {
  version: 2;
  /** The Cruze version whose skills the project installed, recorded by `cruze install`. */
  cruze?: string;
  project: string;
  source: string[];
  tests: string[];
  check: {
    maxLines: number;
    maxTypes: number;
    exceptions: Array<{ path: string; reason: string }>;
  };
  layers: Layer[];
  /**
   * How `cruze review` starts an agent in a fresh context: the program and its arguments.
   * Without one, the calling agent runs the role's prompt in a helper of its own.
   */
  review: { command?: string[] };
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
  const root = asRecord(raw);
  if (root === null) return { config: null, problems: ["the file must be a YAML mapping"] };
  if (root["version"] === 1) return { config: null, problems: ["this config was created by an older Cruze, whose documents this release doesn't read; start the project's Cruze documents again with cruze init in a fresh checkout"] };
  const problems: string[] = [];
  if (root["version"] !== 2) problems.push("version must be 2");
  const cruze = root["cruze"];
  if (cruze !== undefined && (typeof cruze !== "string" || cruze.trim() === "")) problems.push("cruze must be a version string, such as \"0.0.14\"");
  if (typeof root["project"] !== "string" || root["project"] === "") problems.push("project must be a non-empty string");
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

  const review = asRecord(root["review"]) ?? {};
  const reviewCommand = review["command"] === undefined ? undefined : stringList(review["command"], "review.command", problems);
  if (reviewCommand?.length === 0) problems.push("review.command needs at least the program to run");

  const config: CruzeConfig = {
    version: 2,
    ...(typeof cruze === "string" && cruze.trim() !== "" ? { cruze } : {}),
    project: typeof root["project"] === "string" ? root["project"] : "",
    source,
    tests,
    check: { maxLines: maxLines ?? 600, maxTypes: maxTypes ?? 12, exceptions },
    layers,
    review: reviewCommand === undefined || reviewCommand.length === 0 ? {} : { command: reviewCommand },
  };
  return { config, problems };
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
