# Contracts and composition

A contract tells a caller how to use a capability correctly without reading its implementation. A signature alone is not a contract. Apply this to the seams the work touches: ports, use cases other code calls, public APIs, IPC and stored formats. Don't specify every private helper or an imagined future caller.

## Design from the caller

1. Name the real callers: another module, a library user, a CLI user, a plugin, a peer process, or a reader of stored data. A language's `public` keyword doesn't make something a supported API.
2. Write a short usage example in the caller's terms: the outcome, the collaborators needed, valid inputs, and how the caller handles each result and failure.
3. Decide what the caller must not need to know. Expose a capability, not a concrete SDK's operations or your internal data layout.
4. State the obligations from the table below that apply, including what is deliberately left unspecified. Ask the user about any uncertain obligation that matters instead of inventing a guarantee.
5. Show the composition: the entry point, the domain decisions, the collaborators, the effects and who owns each resource. Pick the language mechanism (trait, interface, function type) only after this.

A concrete function or type can be a fine seam. Use a port to keep a technology out of the core, even with one adapter. Don't put an interface on every internal operation, and don't turn a module into a plugin system for callers that don't exist.

## Obligations

In a `PORT` element, each item under `Operations` gives the signature in the project's language, then the rows below that apply.

| Concern | What the caller can rely on |
| --- | --- |
| Provides and requires | Operations offered, capabilities consumed, preconditions |
| Inputs and state | Valid values, invariants, allowed call sequences, where input is trusted |
| Results and effects | What success means, when effects become visible or durable |
| Failure | Which failures the caller can tell apart, partial progress, the state left behind, whether a retry is safe |
| Ownership | What is borrowed, copied or retained, and who releases it |
| Execution | Ordering, concurrency, reentrancy, deadlines and resource limits |
| Lifecycle | Startup, cancellation, completion and shutdown duties |
| Compatibility | Source, binary, wire, stored-data or behavioural promises actually made |
| Freedom | Ordering, representation or diagnostics the caller must not assume |

Add compatibility machinery (versioning, extension points, binary stability) only for a concrete reason: existing callers, stored data, peers that upgrade independently, or an explicit requirement. Name the supported callers or versions when it matters.

A contract lives in one place: the `PORT` or `UC` element in `docs/architecture.md`, a schema, or a header. Deltas replace that element's body rather than writing a second competing definition.

## Compose guarantees, not just types

Suppose an operation saves a document and then notifies subscribers. It must decide what a failed notification means after a successful save. Matching types don't make the pair atomic. The use case owns that outcome and any compensating step; adapters implement the capabilities and translate technical failures.

- Name the owner of each decision, effect, transaction and resource.
- Check that what one component guarantees meets what the next one requires.
- Keep business sequencing and recovery in the use case. The composition root wires components and decides no business policy.
- Avoid ambient transactions, service locators, implicit subscriptions, mutable globals, and background work that callers can discover only by reading code.
- Separate what a component owns from what it borrows. A reusable component never shuts down its caller's runtime or closes a borrowed connection.
- Treat retry permission, deadlines and partial success as behaviour the caller sees, not details an adapter picks.

A `FLOW` element shows the composition for a key scenario. Its `Failure paths` say what each failure leaves behind.

## IPC and stored formats

When a seam crosses processes or persists data, decide the protocol behaviour that applies:

- Framing, encoding, field meanings, numeric ranges, and size limits.
- Handling of unknown, missing or duplicate fields, unknown variants, malformed data and trailing input. A serialization library's defaults are not a policy.
- Correlation, ordering, concurrent requests, reconnects and backpressure.
- Delivery, retries, duplicate handling, and how long an idempotency guarantee lasts.
- Whether cancellation stops the local wait, asks the peer to cancel, or confirms termination, and what effects may remain after a timeout or disconnect.
- Compatibility, only for the peer versions or stored formats you must support. In-memory layout is not a wire format.

A peer may commit a request and then lose the reply, so a timeout doesn't prove a rollback. Decide whether the outcome can be queried, a retry is safe, or the caller sees an unknown outcome. A request ID alone doesn't give exactly-once execution.

## Evidence that a contract holds

- Take expected values from worked examples, independent of the implementation's algorithm.
- Cover a representative success, invalid input, and the important failures and state histories. Assert effects the caller can observe, not private call chains.
- Run one set of contract tests against the fake and every real adapter. Evidence from a fake alone says nothing about the real dependency.
- Where a format or API is promised to outside callers, compile or run a representative caller against it.

Ask two questions of every contract test. What plausible wrong implementation would fail it? Would a different correct implementation pass it without copying these internals?
