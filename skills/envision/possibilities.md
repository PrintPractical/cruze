# Exploring what may come later

The user knows where the product is heading better than any document does, but rarely says it unprompted. Ask, so designs leave room for it and never close it off. One project's user planned downloadable apps, Wi-Fi mesh and reactive telemetry. None of it reached the vision, a feature reversed a principle to serve it, and a later review proposed removing what it needed.

1. **Find the neighbours.** For each goal, user and capability in scope, name the capabilities that products in this domain commonly grow into, from what you know of the domain and its standards. Name them as the user would recognise them: EasyMesh multi-AP or 802.11r fast roaming next to Wi-Fi, prefix delegation next to IPv6, third-party plugins next to a fixed set of kinds, a second transport next to a local socket. Skip those the vision already records under `## Must stay possible` or `## Non-goals`.
2. **Ask them as a round,** following `.agents/skills/cruze-grilling/SKILL.md`: whether the product may need each one, how likely, and why. Recommend an answer from what the user has said so far. Keep a round to 3 to 5, the likeliest first. "No" is a good answer too.
3. **Record each answer:**
   - **Likely or possible:** a `LATER-<name>` row under `## Must stay possible` in `docs/vision.md`, with the likelihood, why in the user's words, and what no design may close off. Say what must stay possible, never how to build it: the mechanism is decided when a feature builds it.
   - **No, for a tempting neighbour of a goal:** a non-goal with the reason, so nobody proposes it again.
   - **No, otherwise:** nothing.
4. **Check the principles.** For each new `LATER` row, check every `PRINCIPLE` row against it. When one would stand in its way, such as "events never drive reconciles" against an orchestrator that reacts to disconnects, settle with the user which one gives, and amend the principle or the row.

Done when every capability in scope has had its neighbours asked about once, and each answer is recorded. The vision changed, so the user approves it again with `cruze approve vision`.
