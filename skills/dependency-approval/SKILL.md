---
name: cruze-dependency-approval
description: The rule for adding dependencies to a Cruze project, covering which need the user's approval, how to ask, and where each is recorded. Use when a design would add a library, package, crate, framework, tool or vendored code; before editing a dependency manifest; when build needs something the design didn't name; and when reviewing a diff that changes dependency declarations.
---

# Dependency approval

Adopt a mature library wherever the clean design uses one. Only a significant dependency needs the user's explicit approval before it is declared or relied on; adopt any other without asking, and record it. A stricter policy in the vision's `## Constraints` wins.

## Significant

A package new to the project is significant when any of these holds:

- It is hard to reverse: an async runtime, an application or UI framework, a database, or a wire or storage format with its code generator.
- It brings native code or a build requirement: C or C++ bindings such as a `-sys` crate, a system library, or a toolchain the build must install.
- Its licence isn't permissive, such as MIT, Apache-2.0, BSD or ISC.
- It does security work: cryptography, TLS, authentication or sandboxing.
- Research found a risk in its health or security record, or it breaks a vision constraint.
- It arrives outside the registry: vendored or copied code, a git dependency or a submodule.

None of these needs approval or a record beyond the manifest: a feature of a package the project uses, declaring it in another crate, workspace member or target, or as a development dependency, and transitive dependencies. Version upgrades follow the project's upgrade policy; point out one that changes licensing, platforms or behaviour.

## Asking

For a significant dependency:

1. Establish the need: the capability, and the design with it and without it, as short code sketches following `.agents/skills/cruze-asking/SKILL.md`.
2. Choose a recommendation, following `.agents/skills/cruze-research/SKILL.md`, which also says where versions come from. Say which adapter owns it, and the port that keeps it out of the core when it is infrastructure.
3. Name the realistic alternatives, including writing it yourself and what owning that code would cost. Never offer a hand-written alternative for cryptography, TLS or a security protocol.
4. Ask, then wait. Nothing is declared, installed or written against it until the user answers.

```markdown
**Dependency: `russh` for SSH hops** (significant: security protocol)
- Why not std or existing: the standard library has no SSH client, and no dependency the project uses provides one.
- Checked: <version from the registry> (released <date>), Apache-2.0, <release cadence>, pure Rust, <n> transitive crates.
- Sits in: the SSH transport adapter, behind the console transport port.
- Alternatives: `ssh2` binds libssh2 (C, needs OpenSSL on macOS); shelling out to `ssh` loses error detail.
Recommended: adopt `russh`. Approve?
```

The user approves by naming the dependency ("use serde"), or by approving an architecture whose Technology table names it.

## Weighing

- Recommend the cleanest design: the one an experienced developer in the language would write, with the least code to own. A dependency, crate or feature is not a cost in itself. Weigh concrete costs: release health, security record, licence, and build time or binary size where a constraint makes them matter.
- "No new dependency" is never the reason for a choice. Name what the chosen option does better.
- A structure the language requires for an idiom, such as a separate crate for a derive macro, is part of that idiom, not an extra cost.
- Hand-writing commodity functionality is the user's call, not adopting a library: a parser, serializer, codec, stream combinator, CLI parser, retries, compression, or date and time handling. Code or a shell command that exists only to avoid a dependency is a design flaw.

## Recording

- The architecture's `## Technology` table records each significant dependency and each framework, with why. An ordinary library needs no record beyond the manifest.
- Hand-writing commodity functionality is recorded in the feature's `## Decisions`, with the concrete reason for owning the code.
- When build needs a significant package the architecture doesn't name, stop and ask as above. A refusal keeps the decision open: don't add the package provisionally, and don't hand-write a replacement unless the user chooses that.

## Checking

When reviewing a diff, compare every place dependencies are declared, such as `Cargo.toml` or `package.json`, CMake `FetchContent`, `.gitmodules` and copied third-party code, with the architecture's Technology table. A significant package without the user's approval is a blocker, even when the build passes.
