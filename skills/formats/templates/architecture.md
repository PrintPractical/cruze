# Architecture: {{project_name}}

## Overview

<What the system is, in two sentences. Then the diagram: inbound adapters on the left, the application core in the middle, the ports and the adapters behind them on the right.>

```mermaid
flowchart LR
```

## Ports

<One subsection per port: what the core needs from the outside world, or offers to it.>

### <Port name>

<What it is for, and who drives it. Then its operations as code, each with its errors.>

```text
```

## Adapters

| Adapter | Implements | Technology |
| --- | --- | --- |
| <name> | <port, or the inbound side it serves> | <library, protocol or device> |

## Runtime

<The threading or async model and how work is scheduled. Every limit and timeout with its number. What happens on overload, when a dependency fails, and at shutdown.>

## Technology

| Choice | For | Why |
| --- | --- | --- |
| <language, framework or significant dependency> | <what it does here> | <why it, in one line> |

## Layers

<The layers, what each holds, and which may import which. The rules are in .cruze/config.yaml, where cruze check enforces them.>

## Decisions

- <A choice that shapes the whole system, and why.>
