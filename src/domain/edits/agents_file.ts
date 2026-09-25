import { factsOf, statusOf } from "../elements.ts";
import type { ProjectView } from "../project/project_view.ts";

/**
 * The managed sections of a project's `AGENTS.md`: its commands, from `.cruze/config.yaml`,
 * and its layout, from the built modules in `docs/architecture.md`.
 */

const OPEN = "<!-- cruze:managed -->";
const CLOSE = "<!-- /cruze:managed -->";

/** Rewrites the managed blocks under `## Commands` and `## Layout`; other text is left alone. */
export function renderAgentsFile(text: string, view: ProjectView): string {
  let next = text;
  const commands = Object.entries(view.config?.config?.commands ?? {});
  if (commands.length > 0) next = replaceBlock(next, "Commands", commands.map(([name, command]) => `- ${name}: \`${command}\``));
  const modules = builtModules(view);
  if (modules.length > 0) next = replaceBlock(next, "Layout", ["Modules, from `docs/architecture.md`:", "", ...modules]);
  return next;
}

function builtModules(view: ProjectView): string[] {
  return [...view.living.elements.values()]
    .filter(({ element, doc }) => element.kind === "MOD" && statusOf(doc, element) === "built")
    .map(({ element, doc }) => {
      const facts = factsOf(doc, element);
      const paths = (facts.get("Path") ?? []).flatMap((value) => [...value.matchAll(/`([^`]+)`/g)].map((m) => `\`${m[1] ?? ""}\``));
      return `- ${paths.join(", ")} (${facts.get("Layer")?.[0] ?? "unknown"}): ${element.title}`;
    })
    .sort();
}

/** Replaces the body of the first managed block after `## <heading>`, before the next `## ` heading. */
function replaceBlock(text: string, heading: string, body: string[]): string {
  const lines = text.split("\n");
  const at = lines.findIndex((line) => line === `## ${heading}`);
  if (at === -1) return text;
  const sectionEnd = lines.findIndex((line, i) => i > at && line.startsWith("## "));
  const end = sectionEnd === -1 ? lines.length : sectionEnd;
  const open = lines.findIndex((line, i) => i > at && i < end && line.trim() === OPEN);
  const close = lines.findIndex((line, i) => i > open && i < end && line.trim() === CLOSE);
  if (open === -1 || close === -1) return text;
  return [...lines.slice(0, open + 1), ...body, ...lines.slice(close)].join("\n");
}
