---
id: 2026-09-24-walking-skeleton
title: Walking skeleton
roadmap: walking-skeleton
---

# Change: Walking skeleton

## Intent

Build `consolectl list` end to end through every layer: configuration file, catalog adapter, inventory domain, use case, CLI and composition root. Later features then extend a structure that already exists, with CI and the layer rules enforced from the first commit. Out of scope: anything that opens a connection.

## Spec delta

### ADDED CAPABILITY inventory: Device inventory
Reading the configured devices and their console paths, and listing them.

### ADDED REQ-inventory.list-devices: List configured devices
The CLI SHALL list every configured device in name order, with its description and a one-line summary of its console path.

#### SCN-inventory.list-configured: Devices with different console paths
- GIVEN the configuration defines `lab-router` with console path `serial /dev/ttyUSB0 115200 8N1`
- AND it defines `core-switch` with console path `ssh ops@jump1.lab:22` then `ssh admin@10.0.0.2:22`
- WHEN the user runs `consolectl list`
- THEN the output has two lines, `core-switch` first and `lab-router` second
- AND the `core-switch` line reads `ssh ops@jump1.lab -> ssh admin@10.0.0.2`

#### SCN-inventory.no-config: No configuration file
- GIVEN no file exists at any of the configuration locations
- WHEN the user runs `consolectl list`
- THEN the CLI prints `no configuration found`, followed by the three paths it searched in order
- AND it exits with code 2

### ADDED REQ-inventory.valid-paths: Reject invalid console paths
The CLI MUST refuse a configuration containing an invalid console path, naming the device and the file line of the problem, and SHALL NOT list any devices from it.

#### SCN-inventory.serial-not-last: Serial hop before another hop
- GIVEN device `lab-router`, defined at line 7 of the configuration, has console path `serial /dev/ttyUSB0 115200 8N1` then `ssh admin@10.0.0.9:22`
- WHEN the user runs `consolectl list`
- THEN the CLI prints `devices.toml:7: lab-router: a serial hop must be the last hop`
- AND it exits with code 2 and lists no devices

## Architecture delta

None. The project architecture already defines every element this change builds.

## Scope

- Delivers: SCN-inventory.list-configured, SCN-inventory.no-config, SCN-inventory.serial-not-last
- Builds: ENT-inventory.inventory, ENT-inventory.device, ENT-inventory.console-path, ENT-inventory.hop, UC-inventory.list-devices, PORT-inventory.device-catalog, ADP-inventory.toml-catalog, ADP-system.cli, FLOW-inventory.list-devices, MOD-inventory.domain, MOD-inventory.app, MOD-inventory.adapters, MOD-system.cli, MOD-system.main

## Test plan

| Subject | Seam | Test file | Kind |
| --- | --- | --- | --- |
| SCN-inventory.list-configured | UC-inventory.list-devices with a fake PORT-inventory.device-catalog | `tests/inventory_list_devices.rs` | behaviour |
| SCN-inventory.no-config | ADP-system.cli, the binary run with an empty configuration home | `tests/cli_list.rs` | behaviour |
| SCN-inventory.serial-not-last | ADP-system.cli, the binary run with a temporary `devices.toml` | `tests/cli_list.rs` | behaviour |
| PORT-inventory.device-catalog | ADP-inventory.toml-catalog and the fake, against the same temporary files | `tests/contract_device_catalog.rs` | contract |
| ENT-inventory.console-path | `ConsolePath::new` hop-order rules | `src/inventory/domain/console_path.rs` | domain |
| FLOW-inventory.list-devices | the `consolectl list` binary | `tests/cli_list.rs` | smoke |

## Tasks

- T1: `Hop` in `src/inventory/domain/hop.rs`, proves ENT-inventory.hop
- T2: `ConsolePath` in `src/inventory/domain/console_path.rs`, proves ENT-inventory.console-path, SCN-inventory.serial-not-last
- T3: `Device` in `src/inventory/domain/device.rs`, proves ENT-inventory.device
- T4: `Inventory` in `src/inventory/domain/inventory.rs`, proves ENT-inventory.inventory
- T5: `DeviceCatalog` port in `src/inventory/app/ports/device_catalog.rs`, proves PORT-inventory.device-catalog
- T6: `ListDevices` in `src/inventory/app/list_devices.rs`, proves UC-inventory.list-devices, SCN-inventory.list-configured
- T7: `TomlCatalog` in `src/inventory/adapters/toml_catalog.rs`, proves ADP-inventory.toml-catalog, SCN-inventory.no-config
- T8: `list` command in `src/cli/args.rs`, `src/cli/list.rs`, `src/cli/output.rs`, proves ADP-system.cli
- T9: `main` in `src/main.rs`, `src/lib.rs`, proves MOD-system.main, FLOW-inventory.list-devices
- T10: `ci` workflow and `make check` in `.github/workflows/ci.yml`, `Makefile`, proves XC-delivery

## Settled decisions

- D1: Paths in `list` output use `->` between hops (the user wanted it to read like the path it takes)
- D2: The skeleton lists devices rather than opening a console (it touches every layer without needing hardware in CI)

<!-- cruze:managed -->
## Progress
- Branch: walking-skeleton
- [x] T1 (4e1c0a2)
- [x] T2 (4e1c0a2)
- [x] T3 (9b27d13)
- [x] T4 (9b27d13)
- [x] T5 (c01f5e8)
- [x] T6 (c01f5e8)
- [x] T7 (5d8a3b0)
- [x] T8 (a7f9e21)
- [x] T9 (a7f9e21)
- [x] T10 (e33c9d4)
- Deviation T7: the configuration search order moved into `toml_catalog.rs` as a function rather than a separate type; same owner, same module
- Landed: 2026-09-24 (merge f02b6c1)
<!-- /cruze:managed -->
