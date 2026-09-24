# Device inventory

Reading the configured devices and their console paths, and listing them.

## REQ-inventory.list-devices: List configured devices
The CLI SHALL list every configured device in name order, with its description and a one-line summary of its console path.

### SCN-inventory.list-configured: Devices with different console paths
- GIVEN the configuration defines `lab-router` with console path `serial /dev/ttyUSB0 115200 8N1`
- AND it defines `core-switch` with console path `ssh ops@jump1.lab:22` then `ssh admin@10.0.0.2:22`
- WHEN the user runs `consolectl list`
- THEN the output has two lines, `core-switch` first and `lab-router` second
- AND the `core-switch` line reads `ssh ops@jump1.lab -> ssh admin@10.0.0.2`
- Status: built

### SCN-inventory.no-config: No configuration file
- GIVEN no file exists at any of the configuration locations
- WHEN the user runs `consolectl list`
- THEN the CLI prints `no configuration found`, followed by the three paths it searched in order
- AND it exits with code 2
- Status: built

## REQ-inventory.valid-paths: Reject invalid console paths
The CLI MUST refuse a configuration containing an invalid console path, naming the device and the file line of the problem, and SHALL NOT list any devices from it.

### SCN-inventory.serial-not-last: Serial hop before another hop
- GIVEN device `lab-router`, defined at line 7 of the configuration, has console path `serial /dev/ttyUSB0 115200 8N1` then `ssh admin@10.0.0.9:22`
- WHEN the user runs `consolectl list`
- THEN the CLI prints `devices.toml:7: lab-router: a serial hop must be the last hop`
- AND it exits with code 2 and lists no devices
- Status: built
