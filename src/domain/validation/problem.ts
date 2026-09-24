/** One way a document breaks the cruze-formats rules. */
export interface Problem {
  path: string;
  /** 1-based line number, when the problem has a location. */
  line?: number;
  rule: string;
  message: string;
  severity: "error" | "warning";
}

export function error(path: string, line: number | undefined, rule: string, message: string): Problem {
  return line === undefined ? { path, rule, message, severity: "error" } : { path, line: line + 1, rule, message, severity: "error" };
}

export function warning(path: string, line: number | undefined, rule: string, message: string): Problem {
  return { ...error(path, line, rule, message), severity: "warning" };
}

export function sortProblems(problems: Problem[]): Problem[] {
  return [...problems].sort((a, b) => a.path.localeCompare(b.path) || (a.line ?? 0) - (b.line ?? 0) || a.rule.localeCompare(b.rule));
}
