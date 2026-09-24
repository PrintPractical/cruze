# Worked example: Console Access

This is a hand-written snapshot of a Cruze project partway through its first release. It shows every document in its real format and how they connect. The formats themselves are defined in [skills/formats](../../skills/formats/SKILL.md). The CLI's validation, status and landing tests use this example as their fixture.

The project is `consolectl`, a command-line tool for macOS and Linux. It reads a configuration file of devices and reaches each device's console through its console path: a local serial port, an SSH connection, or a chain such as SSH to a jump host and then serial. People and agents use it to open a console or run a command on a device.

The code is not included. The documents are what Cruze produces before and during the build.

## The moment captured

1. The vision, glossary and architecture are approved. The architecture describes the whole first release; elements that exist in code are `built`, and the rest are `planned`.
2. The `walking-skeleton` change has landed and is archived. It built `consolectl list` end to end through every layer, which is why the inventory elements are `built`.
3. The `open-console` feature is designed and approved. Its first change, `01-local-serial`, is planned and ready to build.

## Reading order

To see how the entities interact without opening code:

1. [docs/vision.md](docs/vision.md) covers what the tool is for.
2. [docs/glossary.md](docs/glossary.md) covers the words everything else uses.
3. [docs/architecture.md](docs/architecture.md) has the domain model, then the flows. Each flow is a sequence diagram of the elements it touches.
4. [.cruze/features/2026-09-25-open-console/feature.md](.cruze/features/2026-09-25-open-console/feature.md) shows how a feature proposes changes to the specs and the architecture.
5. [01-local-serial/change.md](.cruze/features/2026-09-25-open-console/changes/01-local-serial/change.md) shows one buildable change: scope, test plan and a task per file.

## Files

```text
docs/
  vision.md, glossary.md, architecture.md, roadmap.md
  adr/2026-09-24-hop-chains.md
  specs/inventory.md
.cruze/
  config.yaml
  archive/2026-09-24-walking-skeleton/change.md
  features/2026-09-25-open-console/
    feature.md
    changes/01-local-serial/change.md
```

Approval and journal files are left out because the CLI writes them. There is no `docs/specs/access.md` yet: the `open-console` feature creates it when its first change lands.
