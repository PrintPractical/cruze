# Worked example: Console Access

A hand-written snapshot of a Cruze project partway through its first release, in the formats the [cruze-formats skill](../../skills/formats/SKILL.md) defines. The CLI's tests use it as their fixture, so keep it valid.

The project is `consolectl`, a command-line tool that reads a configuration of lab devices and reaches each device's console over a local serial port, an SSH connection, or SSH hops ending in serial. The code is not included.

The moment captured:

1. [docs/vision.md](docs/vision.md) names the release's four features and what each needs.
2. [docs/architecture.md](docs/architecture.md) maps the ports, adapters and runtime for the whole release.
3. [list-devices](docs/features/list-devices.md), the foundation, is built.
4. [open-serial](docs/features/open-serial.md) is shaped and waiting for the user's approval.

`ssh-hops` and `run-commands` aren't shaped yet; both need `open-serial`. Approvals are left out because only `cruze approve` writes them.
