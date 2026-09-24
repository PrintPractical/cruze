/** Asks the person running Cruze a question. */
export interface Prompter {
  /** Returns the answer, or `fallback` when the answer is empty or nobody can be asked. */
  ask(question: string, fallback: string): Promise<string>;
}
