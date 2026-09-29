import { CruzeError } from "../../domain/cruze_error.ts";
import { resolveArtifact } from "../../domain/project/artifact_ref.ts";
import { featureOf } from "../../domain/project/work_items.ts";
import type { AgentRunner } from "../ports/agent_runner.ts";
import { loadView, type ProjectDeps } from "../project_context.ts";

export const ROLES = ["design-reviewer", "code-reviewer", "verifier", "researcher", "auditor"] as const;
export type Role = (typeof ROLES)[number];

export interface ReviewRequest {
  role: string;
  /** The feature or change under review; omitted for project-scope documents. */
  item?: string;
  round?: number;
  /** The round-1 blockers, for round 2. */
  blockers?: string;
  /** The commit the diff under review starts from. */
  base?: string;
}

/**
 * The role's report, or, when the configured agent isn't installed, the prompt for the calling
 * agent to run in a helper of its own.
 */
export type ReviewReport = { role: Role; item?: string; command: string[] } & (
  | { status: "reported"; report: string }
  | { status: "run-in-helper"; instruction: string; prompt: string }
);

/**
 * Runs a Cruze role in a fresh agent context: the role's prompt, what it reviews, and nothing
 * from the conversation that produced the work. Returns the role's report as written, or the
 * prompt to run in a helper when the configured agent isn't installed.
 */
export async function runReview(deps: ProjectDeps & { runner: AgentRunner }, request: ReviewRequest): Promise<ReviewReport> {
  if (!(ROLES as readonly string[]).includes(request.role)) throw new CruzeError("unknown-role", `the roles are ${ROLES.join(", ")}`);
  const role = request.role as Role;
  const view = await loadView(deps.files);
  const roleText = (await deps.files.readText(`.agents/skills/cruze-roles/${role}.md`)) ?? (await bundledRole(deps, role));

  const context = [`Round: ${request.round ?? 1}`];
  if (request.item !== undefined) {
    const { path, item } = resolveArtifact(view, request.item);
    context.push(`Under review: ${item?.ref ?? path} (\`${path}\`)`);
    const feature = item === undefined ? undefined : featureOf(view.items, item);
    if (feature !== undefined) context.push(`Its feature: \`${feature.path}\``);
    if (role === "design-reviewer" && item !== undefined && item.kind !== "feature") context.push("This is a change's plan: review it with the plan rubric.");
  } else {
    context.push("Under review: the project documents the role lists for project scope");
  }
  if (request.base !== undefined) context.push(`The changes under review: run \`git diff ${request.base}\`.`);
  if (request.blockers !== undefined) context.push(`Round-1 blockers to check:\n\n${request.blockers}`);

  const prompt = [
    roleText.trim(),
    "## This run",
    "You are running the role above in a fresh context, in the project's repository. Read every input it lists from the files, and run the commands it names. Edit no files. End with the report the role describes.",
    context.map((line) => `- ${line}`).join("\n"),
  ].join("\n\n");

  const command = view.config?.config?.review.command ?? [];
  const run = await deps.runner.run(command, prompt);
  const subject = { role, ...(request.item === undefined ? {} : { item: request.item }), command };
  if (run.kind === "missing") return { ...subject, status: "run-in-helper", instruction: helperInstruction(command[0] ?? ""), prompt };
  if (run.exitCode !== 0) throw new CruzeError("review-failed", `${command.join(" ")} exited with ${run.exitCode}: ${run.error.trim() || run.output.trim()}`);
  return { ...subject, status: "reported", report: run.output.trim() };
}

function helperInstruction(program: string): string {
  return [
    `${program === "" ? "No review agent is configured" : `${program} is not installed`}, so cruze review can't start a fresh context.`,
    "Start a helper agent with no conversation history, give it this prompt and nothing else, and take its report as the role's report.",
    "If you can't start a helper, tell the user, and have them run the prompt in a new session.",
    "To use another agent for reviews, set review.command in .cruze/config.yaml.",
  ].join(" ");
}

async function bundledRole(deps: ProjectDeps, role: Role): Promise<string> {
  const roles = (await deps.bundle.skills()).find((skill) => skill.folder === "roles");
  const file = roles?.files.find((f) => f.path === `${role}.md`);
  if (file === undefined) throw new CruzeError("role-missing", `the ${role} role is not installed; run cruze install`);
  return file.text;
}
