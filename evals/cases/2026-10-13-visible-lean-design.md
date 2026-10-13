# The user approved untyped internals and unused fields they never saw

- Proposal: the walkthrough's code sketch shows each caller's call with its declared types, and "yours to decide" lists the decisions no answer settled and every untyped value passed inside the system. Design rubric item 3 counts a field as serving a need only when something reads it, and item 13, "Typed inside", flags a serialization format between the system's own components. Grilling offers to shrink what the user doubts, and stops when an answer keeps growing.
- Evidence: OrkNew (Cruze 0.0.11), feature `2026-10-12-network`. Build stopped at T13 of 20 at 2026-10-12T23:08Z, when the user saw `Status<Map<String, Value>>` in a build question: the 2026-10-11 ndjson ADR had orchestrators exchange JSON frames in process. `lastTransition`, status `labels` and `message` had no reader, and needed a `Clock` port and `Timestamp`. At envision (19:08Z) the user called conditions "so rigid" and was offered to widen `ork wait`. The architecture rethink (23:12Z to 00:42Z) grew `KindValue`, erased-serde, `Payload` and kept entries over 11 questions, and its design review found 5 blockers before the user asked "isn't this getting messy now?".
- Asset: `skills/architect/walkthrough.md`, "The overview", items 3 and 5; `skills/roles/design-rubric.md`, items 3 and 13; `skills/grilling/SKILL.md`, "A round"

## Situation

On the console-access fixture, a feature adds an in-process session recorder that receives each console frame as a `serde_json::Value` from the console use case, and a status field `lastFlushed` that no scenario reads except one that checks it is set.

## Expected

The design review reports a "Typed inside" concern for the `Value` and a Placement finding for `lastFlushed`. The walkthrough sketches the recorder's call with its `Value` parameter and lists it under "What is yours to decide".

## Check

Fixture run: headless `architect "session recorder"` up to the walkthrough. Check the review report for both findings, and the walkthrough message for the sketch and the line.
