import { createInterface } from "node:readline/promises";
import type { Prompter } from "../../app/ports/prompter.ts";

/** Asks on the terminal. Questions go to stderr so stdout stays machine-readable. */
export class TerminalPrompter implements Prompter {
  async ask(question: string, fallback: string): Promise<string> {
    const terminal = createInterface({ input: process.stdin, output: process.stderr });
    try {
      const answer = await terminal.question(`${question} (${fallback}): `);
      return answer.trim() === "" ? fallback : answer.trim();
    } finally {
      terminal.close();
    }
  }
}

/** Used when nobody can answer: without a terminal, or with --yes. */
export class DefaultAnswerPrompter implements Prompter {
  async ask(_question: string, fallback: string): Promise<string> {
    return fallback;
  }
}
