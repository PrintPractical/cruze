# Console Access

## Problem

Reaching a lab device's console means remembering which jump host it hangs off, which serial adapter it is on, and the baud rate, then typing a different chain of `ssh` and `picocom` commands for each device. Agents can't do it at all without that knowledge spelled out every time.

## Users

- Engineers who open device consoles many times a day while developing and debugging router software.
- Coding agents that need to run a command on a device and read the output as part of a task.

## Terms

| Term | Meaning | Avoid |
| --- | --- | --- |
| device | A machine in the lab with a console, named in the configuration | host, target |
| console path | The ordered hops that reach a device's console: SSH hops, then at most one serial port | route, chain |
| hop | One step of a console path: an SSH connection or a serial port | jump |

## Release

The first release: an engineer or an agent reaches any configured device's console with one command, over serial, SSH or both.

| Feature | Summary | Needs |
| --- | --- | --- |
| list-devices | List the configured devices and how each is reached | |
| open-serial | Open an interactive console on a device's local serial port | list-devices |
| ssh-hops | Reach a console through a chain of SSH hosts | open-serial |
| run-commands | Run one command on a device and get its output as JSON | open-serial |

## Future features

| Feature | Summary | Must stay possible |
| --- | --- | --- |
| shared-sessions | Several engineers watch one console session at once | A session's output can reach more than one terminal; nothing assumes the console belongs to one local process |
| session-log | Record console sessions to a file | Every byte a session reads passes one place that could also write it elsewhere |

## Non-goals

- Provisioning or managing devices; the tool only reaches consoles.
- Windows support; the users work on macOS and Linux.
- Storing secrets; authentication uses the SSH agent and key files.

## Constraints

- One static binary for macOS and Linux, written in Rust.
- SSH host keys are verified against `known_hosts`; unknown hosts are refused.
