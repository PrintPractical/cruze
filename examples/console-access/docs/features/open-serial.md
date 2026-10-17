# Open a serial console

- Status: shaped

## Intent

An engineer opens an interactive console on a device's local serial port with one command, without remembering the port or baud rate.

## Behaviour

### SCN-open-serial.attach: Attach to a serial console

- Given `r1` is reached by serial port `/dev/ttyUSB0` at 115200 baud
- When the user runs `consolectl open r1`
- Then the terminal shows the device's console, and what they type reaches the device

### SCN-open-serial.detach: Detach with Ctrl-]

- Given an open console on `r1`
- When the user presses `Ctrl-]`
- Then the console closes and the terminal is back as it was

### SCN-open-serial.port-busy: Port in use

- Given another program holds `/dev/ttyUSB0`
- When the user runs `consolectl open r1`
- Then the command fails with "r1: /dev/ttyUSB0 is in use by another program"

## Public API

```text
$ consolectl open r1
Connected to r1 (serial /dev/ttyUSB0 115200). Ctrl-] to detach.
```

## Stack sketch

```text
Cli --open--> OpenConsole --open--> ConsoleTransport <- SerialTransport (new)
                  |
                  +--attach--> Terminal <- RawTerminal (new)
```

- Adds the ConsoleTransport and Terminal ports, and their serial and raw-terminal adapters.

## Decisions

- Detach is `Ctrl-]`, as in telnet and picocom (engineers already know it).
