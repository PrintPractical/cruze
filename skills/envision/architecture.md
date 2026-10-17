# Designing the architecture map

The architecture map is what every feature's shape and build read first. It says where things live and how the system runs, for the whole release, and leaves room for the future features. Keep it to what changes how code is written: under 3,000 words.

Read `.agents/skills/cruze-hexagonal-design/SKILL.md` and its language file, and `.agents/skills/cruze-dependency-approval/SKILL.md`. When a choice needs evidence, such as which library fits or whether a platform supports something, follow `.agents/skills/cruze-research/SKILL.md`.

1. **Trace each release feature through a hexagon.** For each, name the inbound adapter it arrives through, the use case it runs, the domain it touches and what it needs from outside: storage, network, devices, time. Each thing it needs from outside is a port.
2. **Check the future features against it.** For each, name what must stay possible and the boundary that keeps it so, such as a port that a second adapter could implement, or a type that doesn't assume one owner. Build nothing for them.
3. **Write the ports.** For each, its operations as code in the project's language, each with its errors and every number it depends on: timeouts, limits, buffer sizes.
4. **Write the runtime.** The threading or async model; where work queues, and what a full queue does; how a failed dependency is noticed and recovered from; what shutdown waits for and for how long. Follow `.agents/skills/cruze-hexagonal-design/runtime.md`.
5. **Choose the technology.** The language and framework, and each significant dependency, through the dependency-approval skill. Record each with why in one line.
6. **Write the layers** in prose, then as `layers:` in `.cruze/config.yaml`, with `source` and `tests` globs for the project's language, as `.agents/skills/cruze-formats/config.md` shows.
7. **Draw the overview** as a Mermaid flowchart: inbound adapters, the core, the ports and the adapters behind them.
8. **Record the decisions** that shape the whole system, one line each with the reason.

Done when `cruze validate` reports no problem in `docs/architecture.md` or the config.
