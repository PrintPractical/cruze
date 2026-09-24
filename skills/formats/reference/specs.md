# Specs format

`docs/specs/<capability>.md` holds the living behaviour of one capability, meaning what the system does as seen from outside. Requirements say what must hold. Scenarios are worked examples that become behaviour tests. Nothing in a spec names classes, files or libraries; those belong in the architecture.

Template: [../templates/spec.md](../templates/spec.md).

## Spec file

```markdown
# Console access

Opening consoles on configured devices and running commands on them.

## REQ-access.open-console: Open a device console
The CLI SHALL connect the user's terminal to the console of a configured device, through every hop of its console path, and restore the terminal when the session ends.

### SCN-access.direct-serial: Console on a local serial port
- GIVEN device `lab-router` has console path `serial /dev/ttyUSB0 115200`
- WHEN the user runs `consolectl open lab-router`
- THEN the terminal shows the device's console output within 2 seconds
- AND pressing `Ctrl-]` then `q` closes the session and restores the terminal
```

- The file name is the capability, and the capability is the scope of every ID in it.
- One `#` title, then a purpose paragraph of one to three sentences.
- Each requirement is a `##` heading element, `REQ-<capability>.<name>: <Title>`. Its body states the requirement in one to three sentences containing `SHALL` or `MUST`. Use `SHALL NOT` or `MUST NOT` for behaviour that must never happen.
- Each scenario is a `###` heading element under its requirement, `SCN-<capability>.<name>: <Title>`. A requirement has at least one.

## Scenario grammar

- Bullets in order: zero or more `GIVEN`, one `WHEN`, one or more `THEN`. `AND` continues the clause above it.
- Use concrete values: names, inputs, outputs, limits and times. The expected values are the test's oracle, worked out by hand. They are never copied from running the code.
- One behaviour per scenario. Failure behaviour gets its own scenario, including what state is left behind.
- The CLI adds a managed `- Status:` item. A scenario is `built` once a landed change delivered it with a passing test that names its ID.

## Spec delta

A feature, or a standalone change, proposes behaviour changes in its `## Spec delta` section. Operation headings sit at `###` and scenarios at `####`:

```markdown
### ADDED CAPABILITY inventory: Device inventory
Reading and validating the configured devices and their console paths.

### ADDED REQ-access.jump-host-chain: Connect through jump hosts
The CLI SHALL reach a device's console through every SSH hop in its console path, in order.

#### SCN-access.serial-behind-jump-host: Serial console on a jump host
- GIVEN ...

### MODIFIED REQ-access.open-console: Open a device console
The full new requirement text.

#### SCN-access.direct-serial: Console on a local serial port
- ...every scenario the requirement keeps, in full

### REMOVED REQ-access.telnet: Telnet consoles
- Reason: telnet support was dropped
- Migration: configure an SSH hop to a terminal server instead
```

- `ADDED CAPABILITY` creates a new spec file, with its title and purpose paragraph. It is only needed for a capability that has no file yet.
- `ADDED` introduces a new requirement with all its scenarios.
- `MODIFIED` replaces a requirement's whole block, including every scenario it keeps. A scenario left out is removed.
- `REMOVED` retires a requirement and its scenarios, and needs a `Reason` and a `Migration`.
- `land` shifts heading levels to fit the spec file and keeps the managed status of scenarios that were already built.
