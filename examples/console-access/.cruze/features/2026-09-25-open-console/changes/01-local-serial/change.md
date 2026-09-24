---
id: 01-local-serial
title: Console on a local serial port
---

# Change: Console on a local serial port

## Scope

- Delivers: SCN-access.direct-serial, SCN-access.detach, SCN-access.escape-not-completed, SCN-access.serial-busy, SCN-access.unknown-device-suggestion
- Builds: ENT-access.console-session, ENT-access.escape-detector, UC-inventory.find-device, UC-access.open-console, PORT-access.console-link, PORT-access.hop-connector, PORT-access.terminal, ADP-access.serial-connector, ADP-access.raw-terminal, ADP-system.cli, FLOW-access.open-console, MOD-access.domain, MOD-access.app, MOD-access.adapters

## Test plan

| Subject | Seam | Test file | Kind |
| --- | --- | --- | --- |
| SCN-access.direct-serial | UC-access.open-console with fake PORT-access.hop-connector and fake PORT-access.terminal | `tests/access_open_console.rs` | behaviour |
| SCN-access.detach | UC-access.open-console with the same fakes; asserts close order and terminal restore | `tests/access_open_console.rs` | behaviour |
| SCN-access.escape-not-completed | UC-access.open-console with the same fakes; asserts bytes received by the fake link | `tests/access_open_console.rs` | behaviour |
| SCN-access.serial-busy | UC-access.open-console with a fake PORT-access.hop-connector that fails hop 1 with `Busy`; ADP-system.cli renders the error | `tests/access_open_console.rs` | behaviour |
| SCN-access.unknown-device-suggestion | ADP-system.cli, the binary run with a temporary `devices.toml` | `tests/cli_open.rs` | behaviour |
| PORT-access.hop-connector | ADP-access.serial-connector and the fake, over a pseudo-terminal pair | `tests/contract_hop_connector.rs` | contract |
| PORT-access.terminal | ADP-access.raw-terminal and the fake, on a pseudo-terminal | `tests/contract_terminal.rs` | contract |
| ENT-access.escape-detector | `EscapeDetector::feed` over every state and byte class | `src/access/domain/escape_detector.rs` | domain |
| ENT-access.console-session | state transitions, and close order through a chain of fake links | `src/access/domain/console_session.rs` | domain |
| FLOW-access.open-console | `consolectl open` against a pseudo-terminal standing in for the serial device | `tests/cli_open.rs` | smoke |

## Tasks

- T1: `EscapeDetector` in `src/access/domain/escape_detector.rs`, proves ENT-access.escape-detector, SCN-access.escape-not-completed
- T2: `ConsoleSession` in `src/access/domain/console_session.rs`, proves ENT-access.console-session
- T3: `ConsoleLink` port in `src/access/app/ports/console_link.rs`, proves PORT-access.console-link
- T4: `HopConnector` port in `src/access/app/ports/hop_connector.rs`, proves PORT-access.hop-connector
- T5: `Terminal` port in `src/access/app/ports/terminal.rs`, proves PORT-access.terminal
- T6: `FindDevice` in `src/inventory/app/find_device.rs`, proves UC-inventory.find-device, SCN-access.unknown-device-suggestion
- T7: `OpenConsole` in `src/access/app/open_console.rs`, proves UC-access.open-console, SCN-access.direct-serial, SCN-access.detach, SCN-access.serial-busy
- T8: `SerialConnector` in `src/access/adapters/serial_connector.rs`, proves ADP-access.serial-connector
- T9: `RawTerminal` in `src/access/adapters/raw_terminal.rs`, proves ADP-access.raw-terminal
- T10: `open` command in `src/cli/args.rs`, `src/cli/open.rs`, `src/cli/output.rs`, proves ADP-system.cli
- T11: `main` in `src/main.rs`, proves FLOW-access.open-console

## Settled decisions

- D1: Tests stand in for serial devices with pseudo-terminal pairs, so CI needs no hardware (the user confirmed CI runs on macOS and Linux runners, which both support them)
- D2: The session relays bytes with one `tokio::select!` loop over terminal input and link output, using 4 KiB buffers (one task means no locking around the link)

## Risks

- T7 is the riskiest task: the relay loop must stop cleanly on detach, remote close and link errors without losing the last output bytes.
- T9 could leave a user's terminal in raw mode on a panic. The contract test kills a session mid-relay and checks the terminal mode is restored.

<!-- cruze:managed -->
## Progress
- Branch: open-console-local-serial
- [ ] T1
- [ ] T2
- [ ] T3
- [ ] T4
- [ ] T5
- [ ] T6
- [ ] T7
- [ ] T8
- [ ] T9
- [ ] T10
- [ ] T11
<!-- /cruze:managed -->
