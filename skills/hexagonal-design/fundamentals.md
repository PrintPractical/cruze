# Engineering fundamentals

Use these to test material engineering choices in a design, a plan, code or a review. Keep the search bounded by the work at hand: the seams it touches, its scenarios, and the failure and workload risks that are credible. Stop when those have decisions backed by evidence.

## Workload before structure

- Before choosing a data structure, describe the operations that dominate the real workload: input size and its upper bound, the mix of lookups, inserts, deletes and scans, ordering and duplicate rules, how it's mutated, concurrency, latency target and memory budget.
- State the expected, worst-case or amortized cost that matters, and the skewed or hostile inputs that change it.
- Enforce bounds at trust boundaries, before allocation, indexing, recursion, conversion and arithmetic. Account for overflow, truncation, empty input and limits across concurrent work.
- Choose by the operations you need: a contiguous sequence for ordered scans and indexing, a hash map or set for keyed lookup, an ordered map for sorted traversal and ranges, a heap for repeated minimum or maximum, a queue for FIFO work. A small bounded scan beats an index that costs more to maintain than it saves.

## States and transitions

- Represent a closed set of states with the language's strongest practical type: an enum, sum type or tagged union. Keep each state's data on its variant, instead of coordinating booleans, nulls and loose fields.
- Define the legal transitions in one visible operation or table. Construction and deserialization validate the state, mutation rejects illegal transitions, and exhaustive matching forces a decision when a state is added.
- When states cross a stored, wire or public boundary, change their serialized names, values or unknown-state handling only on purpose, with the migration decided.

## The cheapest abstraction that works

- Start concrete when there is one behaviour and one representation. Extract a function when only an operation varies. Use an enum for a closed set of variants, generics for compile-time variation, an interface or trait for open substitution, and dynamic dispatch only when runtime variety requires it.
- Name the alternatives and their costs: a direct collaborator or an interface, a closed enum or plugin dispatch, a generic algorithm or two concrete functions.
- Add an abstraction for a current variation point, boundary, invariant or test seam, not for an imagined second implementation. Equally, merge duplicated domain rules that must change together.

## Standard machinery first

- Use the language's standard algorithms, collections, parsing and resource-management constructs when their contracts fit.
- Check the real contract: ordering and stability, comparator requirements, invalidation on mutation, allocation, errors, partial results and complexity.
- Write a direct loop when it makes stateful control flow clearer, or when the standard operation can't meet a demonstrated bound. Say why, and test the edge cases.

## Equality, hashing and ordering

- Define domain identity before implementing equality. Equal values hash equally, and an ordering agrees with equality wherever an ordered collection relies on it.
- Keep keys stable while they sit in a hash or ordered collection. Never base identity on mutable, transient, locale-dependent or process-specific data unless that is the contract.
- Decide the edge cases the language won't decide for you: case and Unicode normalization, `NaN` and signed zero, absent values, identity versus value equality, and tie-breaks.

## Termination, fan-out and resources

- Every loop, recursion, retry, poll, queue, stream and background task has a termination or cancellation condition. Where progress isn't guaranteed, give a maximum count, depth or duration.
- Bound fan-out and buffering by the workload and the capacity downstream: concurrency limits, queue sizes, backpressure, overload behaviour and who sees the failure.
- Pair every acquired resource with an owner and a release path across success, error, cancellation and partial initialization. That includes memory, file descriptors, sockets, locks, transactions, temporary files, subscriptions, timers, tasks and external quotas.

## Duplicated literals

- Give a literal one home when it encodes a domain fact or must change in step with others: states, event kinds, protocol fields, units, limits, error codes, paths, header names and serialization keys. That home is a typed value, a named constant, a schema or a config entry, at the boundary that owns it.
- Leave incidental repetition alone: log messages, test descriptions, fixture text and one-off explanations are clearer in place.
- Before extracting a literal, name the future change the extraction keeps consistent.

## Findings

Each material finding gives the evidence, the workload or invariant affected, and a concrete alternative. "Use a deque, because removing from the front of this array is linear at the stated queue bound" is a finding. "Improve performance" is not.
