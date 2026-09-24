# Roadmap

## Release

v0.1: open any configured device's console, and let agents run commands on devices.

## Phases

### Phase 1: Walking skeleton

| Item | Kind | Goals | Blocked by |
| --- | --- | --- | --- |
| walking-skeleton | change | GOAL-paths-in-config | |

### Phase 2: Consoles

| Item | Kind | Goals | Blocked by |
| --- | --- | --- | --- |
| open-console | feature | GOAL-one-command, GOAL-paths-in-config | walking-skeleton |
| remote-serial | feature | GOAL-one-command | open-console |

### Phase 3: Agents

| Item | Kind | Goals | Blocked by |
| --- | --- | --- | --- |
| run-commands | feature | GOAL-agent-commands | open-console |

## Coverage

| Goal | Items |
| --- | --- |
| GOAL-one-command | open-console, remote-serial |
| GOAL-paths-in-config | walking-skeleton, open-console |
| GOAL-agent-commands | run-commands |

<!-- cruze:managed -->
## Status

| Item | ID | State |
| --- | --- | --- |
| walking-skeleton | 2026-09-24-walking-skeleton | landed |
| open-console | 2026-09-25-open-console | building |
<!-- /cruze:managed -->
