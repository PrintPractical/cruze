#!/usr/bin/env node
// Composition root: the only place that constructs adapters.
import { basename, relative } from "node:path";
import { runCli } from "./adapters/inbound/cli/run_cli.ts";
import { GitRepository } from "./adapters/outbound/git_repository.ts";
import { NodeProjectFiles } from "./adapters/outbound/node_project_files.ts";
import { PackageBundle } from "./adapters/outbound/package_bundle.ts";
import { findProjectRoot } from "./adapters/outbound/project_root.ts";
import { ProcessAgentRunner } from "./adapters/outbound/process_agent_runner.ts";
import { SystemClock } from "./adapters/outbound/system_clock.ts";
import { DefaultAnswerPrompter, TerminalPrompter } from "./adapters/outbound/terminal_prompter.ts";

// A reader that stops early, such as `cruze journal list | head`, closes the pipe; that is not an error worth a stack trace.
process.stdout.on("error", (error: NodeJS.ErrnoException) => {
  if (error.code === "EPIPE") process.exit(0);
  throw error;
});

const cwd = process.cwd();
// Every command but init works on the project that holds the working directory, so it runs from any subdirectory.
const root = process.argv[2] === "init" ? cwd : (findProjectRoot(cwd) ?? cwd);
const exitCode = await runCli(
  process.argv.slice(2),
  {
    files: new NodeProjectFiles(root),
    bundle: await PackageBundle.locate(),
    clock: new SystemClock(),
    repository: new GitRepository(root),
    interactivePrompter: new TerminalPrompter(),
    unattendedPrompter: new DefaultAnswerPrompter(),
    runner: new ProcessAgentRunner(root),
    interactive: process.stdin.isTTY === true,
    directoryName: basename(cwd),
    workingDirectory: relative(root, cwd).split("\\").join("/"),
  },
  {
    stdout: (text) => process.stdout.write(`${text}\n`),
    stderr: (text) => process.stderr.write(`${text}\n`),
    stdoutIsTerminal: process.stdout.isTTY === true,
  },
);
process.exitCode = exitCode;
