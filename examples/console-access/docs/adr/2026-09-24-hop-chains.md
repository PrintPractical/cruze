# Console paths are ordered hop chains, connected link over link

- Status: accepted
- Date: 2026-09-24
- Elements: ENT-inventory.console-path, PORT-access.hop-connector, ADP-access.ssh-connector

Devices sit behind different mixes of jump hosts and serial adapters, and the tool must report exactly which hop failed. We model a console path as an ordered chain of hops. Each hop is connected by a hop connector over the link produced by the hop before it, using `russh` running over that link. We rejected shelling out to OpenSSH with `ProxyJump`: it works for pure SSH chains, but it hides which hop failed, depends on each user's `ssh_config`, and can't continue into a serial hop on the last host. The chain model costs us owning SSH connection handling in-process, which `russh` makes practical.
