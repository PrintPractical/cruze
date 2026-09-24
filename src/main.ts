#!/usr/bin/env node
// Composition root: the only place that constructs adapters.
import { basename } from "node:path";
import { runCli } from "./adapters/inbound/cli/run_cli.ts";
import { NodeProjectFiles } from "./adapters/outbound/node_project_files.ts";
import { PackageBundle } from "./adapters/outbound/package_bundle.ts";
import { DefaultAnswerPrompter, TerminalPrompter } from "./adapters/outbound/terminal_prompter.ts";

const cwd = process.cwd();
const exitCode = await runCli(
  process.argv.slice(2),
  {
    files: new NodeProjectFiles(cwd),
    bundle: await PackageBundle.locate(),
    interactivePrompter: new TerminalPrompter(),
    unattendedPrompter: new DefaultAnswerPrompter(),
    interactive: process.stdin.isTTY === true,
    directoryName: basename(cwd),
  },
  {
    stdout: (text) => process.stdout.write(`${text}\n`),
    stderr: (text) => process.stderr.write(`${text}\n`),
    stdoutIsTerminal: process.stdout.isTTY === true,
  },
);
process.exitCode = exitCode;
