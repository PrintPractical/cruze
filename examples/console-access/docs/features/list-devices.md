# List devices

- Status: built

## Intent

An engineer or agent sees every configured device and how its console is reached, so they know what `consolectl` can open before trying.

## Behaviour

### SCN-list-devices.lists-all: List every device

- Given a configuration with the devices `r1` (serial) and `r2` (SSH to `jump`, then serial)
- When the user runs `consolectl list`
- Then each device is shown on one line with its console path, in name order

### SCN-list-devices.bad-config: Refuse a broken configuration

- Given a configuration where `r3` has two serial hops
- When the user runs `consolectl list`
- Then the command fails with "r3: a console path has at most one serial hop, at the end"

## Public API

```text
$ consolectl list
r1  serial /dev/ttyUSB0 115200
r2  ssh jump -> serial /dev/ttyUSB1 9600

$ consolectl list --json
[{"name":"r1","path":[{"serial":{"port":"/dev/ttyUSB0","baud":115200}}]}, ...]
```

## Stack sketch

```text
Cli --list--> ListDevices --load--> DeviceSource <- TomlDevices (new)
                 |
                 +--> Device, ConsolePath (new, domain)
```

- Adds the DeviceSource port and the TomlDevices adapter.

## Decisions

- Devices are listed in name order, not file order (scripts reading the output get a stable order).
