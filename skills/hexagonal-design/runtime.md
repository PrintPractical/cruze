# Runtime ownership

Runtime architecture decides how work executes and who owns resources. It is independent of the hexagonal layers: a port is not a thread, and a use case is not a task. Record runtime decisions in an `XC-concurrency` element under the architecture's cross-cutting concerns, and in the `Operations` contracts of the ports involved.

## Choose the execution model

Pick the simplest model that meets the ownership, concurrency, lifecycle, isolation and performance needs: direct calls, async calls, tasks, an event loop, actors, a worker pool, dedicated threads, state machines or a pipeline. State the concrete need before adding a task, channel, queue or scheduler hop.

Stateless transformation and ordinary domain computation get no task or actor of their own.

## Resource owners

Every long-lived, mutable, stateful or exclusive resource has one named owner. This covers sockets, connections, sessions, hardware devices, subprocesses, mutable runtime state and shared caches.

- Say how the resource is created, accessed, mutated, failed and shut down, and what final cleanup happens.
- For background work, say how it is cancelled and whether shutdown drains, rejects or abandons work in flight.
- A dedicated task or component can own a resource when that buys exclusive ownership, serialized mutation, event handling, lifecycle control or failure isolation. A lock is simpler for plain shared in-process state. Message passing is not always better.
- Bound every queue, and say what happens on overload.
- For repeated operations on a resource, use `registry -> resolved handle -> resource`, with the registry named for what it holds, such as `SessionRegistry`. The registry discovers, creates, registers and hands out handles. Routine work goes through the handle, not back through the registry.

## State machines

- Use an explicit state machine when the valid operations depend on the current state. Explicit states and transitions replace combinations of boolean flags.
- State with domain meaning, such as a console session being `opening`, `open` or `closed`, belongs in the domain as an `ENT` with a `States` fact.
- State that exists because of a protocol, transport, OS, hardware interface or runtime lifecycle belongs to the adapter or runtime component that owns that concern.

## Failures, retries and cancellation

- Technical retry and backoff live in an outbound adapter. Whether an operation is safe to repeat, and the use case's deadline, are part of the core contract.
- Never retry non-idempotent work blindly, and never stack retries at several layers.
- Stopping a wait, dropping a future, requesting cancellation, ending a task and cancelling remotely are different events. Say which one an operation promises, what effects may remain, and how completion is observed.
- When a caller needs a guaranteed or fallible finish, give it an explicit `close` or `shutdown` operation. Destruction alone can't report failure.

## Cross-cutting infrastructure

Centralize repeated tracing and context propagation, authentication metadata, instrumentation, protocol error mapping and serialization conventions in middleware, wrappers or a dedicated adapter component. Record each as an `XC` element. Business policy, such as an authorization decision, stays in the core even when it recurs.

## Performance

- On a hot path, look for avoidable allocations, copies, serialization, queue hops, scheduler transitions, repeated lookups and repeated policy evaluation.
- Resolve an expensive decision once, for as long as its result stays valid, and say what invalidates it.
- Measure the real workload before adding complex optimization. Clean layering doesn't justify runtime overhead, and speculative performance doesn't justify erasing an ownership boundary.

## Tests these decisions need

- A device session owned by one task: test acquisition failure, overload, cancellation and cleanup.
- A state machine: test each rejected transition and the behaviour of each terminal state.
- A cached handle: test what happens after the resource is removed or replaced.
