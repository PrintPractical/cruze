# Console Access

## Problem

Reaching a lab device's console means remembering which jump host it hangs off, which serial adapter it is on, and the baud rate, then typing a different chain of `ssh` and `picocom` commands for each device. Agents can't do it at all without that knowledge spelled out every time.

## Users

- Engineers who open device consoles many times a day while developing and debugging router software.
- Coding agents that need to run a command on a device and read the output as part of a task.

## Goals

| ID | Goal | Measure |
| --- | --- | --- |
| GOAL-one-command | Reach any configured device's console with one command | `consolectl open <device>` works for every console path in the configuration |
| GOAL-paths-in-config | Console paths live in configuration, not in people's heads | Adding a device needs only a configuration entry |
| GOAL-agent-commands | An agent can run a command on a device and get its output | `consolectl run <device> -- <command>` returns output as JSON |

## Non-goals

- Provisioning or managing devices; the tool only reaches consoles.
- Windows support; the users work on macOS and Linux.
- Storing secrets; authentication uses the SSH agent and key files.
- A long-running daemon; every invocation stands alone.

## Constraints

- One static binary for macOS and Linux, written in Rust.
- SSH host keys are verified against `known_hosts`; unknown hosts are refused.
- Opening a console adds no noticeable delay beyond the hops themselves.

<!-- cruze:managed -->
## Feature map

### Implemented

| Feature | Release | Summary |
| --- | --- | --- |

### Future

| Feature | Summary | Goals |
| --- | --- | --- |
| open-console | Interactive console over local serial and SSH hop chains | GOAL-one-command, GOAL-paths-in-config |
| remote-serial | Serial consoles attached to a jump host | GOAL-one-command |
| run-commands | Run one command on a device and return its output | GOAL-agent-commands |
| session-log | Record console sessions to a file | GOAL-one-command |
<!-- /cruze:managed -->
