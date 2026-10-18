# Self-check before showing a feature

Read the feature as an implementer who never saw the conversation. Each "no" is a gap build would fill with a guess; fix it in the document.

1. **Every failure has a scenario.** For each external call the feature makes, and each input a user gives, the scenarios say what the user sees when it fails: the message, the exit code or the screen, and what state is left behind.
2. **Every number is written down.** Each timeout, limit, buffer size, retry count and poll interval the feature depends on has a value, in the scenario or the architecture's runtime.
3. **Every queue says what happens when it is full.** For each channel, buffer or queue the feature adds: what a sender does when it is full, and which other work waits meanwhile. One slow peer holds up only its own work unless a decision says otherwise.
4. **Shutdown and recovery are covered.** What happens to work in flight when the process stops, a connection drops, or a dependency comes back.
5. **The public API is complete.** Every error a caller can meet is named in the code sketch. Nothing public exists only for a later feature.
6. **The ports stay ports.** No technology type, such as a database row, an HTTP request or a JSON value, crosses into the domain or the use cases.
7. **Nothing is built ahead of need.** Every type, field and operation in the sketch is used by one of this feature's scenarios. A future feature leaves room; it adds nothing now.
8. **Each scenario can be tested** through a public interface, with the values it states.
