import { CruzeError } from "../../domain/cruze_error.ts";
import type { AgentRunner } from "../ports/agent_runner.ts";
import { loadDocs, type ProjectDeps } from "../project_context.ts";

export const ROLES = ["code-reviewer", "doc-reviewer", "researcher"] as const;
export type Role = (typeof ROLES)[number];

export interface ReviewRequest {
  role: string;
  /** The feature under review, by slug. */
  item?: string;
  /** The commit the diff under review starts from. */
  base?: string;
}

/**
 * The role's report, or, when the configured agent isn't installed, the prompt for the calling
 * agent to run in a helper of its own.
 */
export type ReviewReport = { role: Role; item?: string; command?: string[] } & (
  | { status: "reported"; report: string }
  | { status: "run-in-helper"; instruction: string; prompt: string }
);

/**
 * Runs a Cruze role in a fresh agent context: the role's prompt, what it reviews, and nothing
 * from the conversation that produced the work.
 */
export async function runReview(deps: ProjectDeps & { runner: AgentRunner }, request: ReviewRequest): Promise<ReviewReport> {
  if (!(ROLES as readonly string[]).includes(request.role)) throw new CruzeError("unknown-role", `the roles are ${ROLES.join(", ")}`);
  const role = request.role as Role;
  const docs = await loadDocs(deps.files);
  const roleText = (await deps.files.readText(`.agents/skills/cruze-roles/${role}.md`)) ?? (await bundledRole(deps, role));

  const context: string[] = [];
  if (request.item !== undefined) {
    const feature = docs.features.find((f) => f.slug === request.item);
    if (feature === undefined) throw new CruzeError("not-found", `no feature ${request.item} in docs/features/`);
    context.push(`Under review: the feature in \`${feature.path}\``);
  }
  if (request.base !== undefined) context.push(`The changes under review: run \`git diff ${request.base}\`.`);

  const prompt = [
    roleText.trim(),
    "## This run",
    "You are running the role above in a fresh context, in the project's repository. Read every input it lists from the files, and run the commands it names. Edit no files. End with the report the role describes.",
    ...(context.length === 0 ? [] : [context.map((line) => `- ${line}`).join("\n")]),
  ].join("\n\n");

  const subject = { role, ...(request.item === undefined ? {} : { item: request.item }) };
  const command = docs.config?.config?.review.command;
  if (command === undefined) return { ...subject, status: "run-in-helper", instruction: helperInstruction(undefined), prompt };
  const run = await deps.runner.run(command, prompt);
  if (run.kind === "missing") return { ...subject, command, status: "run-in-helper", instruction: helperInstruction(command[0]), prompt };
  if (run.exitCode !== 0) throw new CruzeError("review-failed", `${command.join(" ")} exited with ${run.exitCode}: ${run.error.trim() || run.output.trim()}`);
  return { ...subject, command, status: "reported", report: run.output.trim() };
}

/** Why cruze review can't start the fresh context itself, and how the calling agent does instead. */
function helperInstruction(program: string | undefined): string {
  return [
    program === undefined ? "No review agent is configured under review.command." : `${program} is not installed, so cruze review can't start a fresh context.`,
    "Start a helper agent with no conversation history, give it this prompt and nothing else, and take its report as the role's report.",
    "If you can't start a helper, tell the user, and have them run the prompt in a new session.",
    "To have cruze review start an agent itself, set review.command in .cruze/config.yaml.",
  ].join(" ");
}

async function bundledRole(deps: ProjectDeps, role: Role): Promise<string> {
  const roles = (await deps.bundle.skills()).find((skill) => skill.folder === "roles");
  const file = roles?.files.find((f) => f.path === `${role}.md`);
  if (file === undefined) throw new CruzeError("role-missing", `the ${role} role is not installed; run cruze install`);
  return file.text;
}
