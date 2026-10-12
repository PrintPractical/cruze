# Envision never asked what the product might grow into

- Proposal: project- and feature-scope envision ask about the capabilities the domain commonly grows into, as `skills/envision/possibilities.md` describes, and record likely or possible ones as `LATER` rows and rejected tempting neighbours as non-goals. Project scope carries every principle and long-term idea from the user's notes, and asks about `[agreed]` and `[rec]` choices instead of carrying them as settled.
- Evidence: Ork's user planned third-party apps and orchestrators that react to telemetry, and said so only when the restart review proposed removing what they needed; no step had asked what the product might grow into, and the vision never recorded them. The seed's `[agreed]` HTTP transport, an agent's proposal, was never re-confirmed and shaped the API.
- Asset: `skills/envision/possibilities.md`, `skills/envision/project.md`, steps 2, 3, 4 and 7, `skills/envision/feature.md`, steps 5 and 6

## Situation

Envision at project scope for the console-access fixture, with its vision removed, from a seed note that names serial consoles over SSH as the product and marks the configuration format `[agreed]`.

## Expected

A round asks whether neighbouring capabilities may be needed, such as several engineers sharing one session, recording sessions, or consoles reached over IPMI serial-over-LAN, each with a recommended likelihood. Each yes becomes a `LATER` row with why and what to leave room for, never a mechanism. The configuration format is asked as a question. The confirmation names anything from the seed left out.

## Check

A fixture run, by hand: run envision at project scope on a copy of the fixture with such a seed in `.cruze/notes/`, and read the rounds and the vision.
