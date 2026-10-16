---
name: cruze-dependency-approval
description: The rule for adding dependencies to a Cruze project, covering which need the user's approval, how to ask, and where each is recorded. Use when a design or plan would add a library, package, crate, framework, tool or vendored code; before editing a dependency manifest; when build needs something the design didn't name; and when reviewing a diff that changes dependency declarations.
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

1. Establish the need: the capability, and the design with it and without it, as short code sketches following `.agents/skills/cruze-grilling/illustrating.md`.
2. Choose a recommendation, following `.agents/skills/cruze-research/SKILL.md`, which also says where versions come from. Say which module owns it, and the port that keeps it out of the core when it is infrastructure.
3. Name the realistic alternatives, including writing it yourself and what owning that code would cost. Never offer a hand-written alternative for cryptography, TLS or a security protocol.
4. Ask, then wait. Nothing is declared, installed or written against it until the user answers.

```markdown
**Dependency: `russh` for SSH hops** (significant: security protocol)
- Why not std or existing: the standard library has no SSH client, and no dependency the project uses provides one.
- Checked: <version from the registry> (released <date>), Apache-2.0, <release cadence>, pure Rust, <n> transitive crates.
- Sits in: ADP-access.ssh-connector, behind PORT-access.hop-connector.
- Alternatives: `ssh2` binds libssh2 (C, needs OpenSSL on macOS); shelling out to `ssh` loses error detail.
Recommended: adopt `russh`. Approve?
```

The user approves by naming the dependency ("use serde"), or by approving a design whose `## Adopt or build` table or `Adopts` fact names it.

## Weighing

- Recommend the cleanest design: the one an experienced developer in the language would write, with the least code to own. A dependency, crate or feature is not a cost in itself. Weigh concrete costs: release health, security record, licence, and build time or binary size where a constraint makes them matter.
- "No new dependency" is never the reason for a choice. Name what the chosen option does better.
- A structure the language requires for an idiom, such as a separate crate for a derive macro, is part of that idiom, not an extra cost.
- Hand-writing commodity functionality is the user's call, not adopting a library: a parser, serializer, codec, stream combinator, CLI parser, retries, compression, or date and time handling. Code or a shell command that exists only to avoid a dependency is a design flaw.

## Recording

- A feature or standalone change records each new package as a row in `## Adopt or build`: the component, `adopt`, the package, and the reason. The adapter that uses it carries an `Adopts` fact in the architecture delta.
- At project scope, the adapter's `Adopts` fact in `docs/architecture.md` records it, and a dependency no adapter owns, such as a test framework or a build tool, goes in the foundation change's `## Adopt or build`. A significant choice that is hard to reverse also gets an ADR.
- A `build` row records a choice to hand-write commodity functionality, with the concrete reason for owning the code.
- When build needs a package the design didn't name, and it isn't significant, adopt it and record a deviation naming the package and its purpose. When it is significant, stop the task and ask as above. The answer is a detail, as `.agents/skills/cruze-rethink/levels.md` says, unless the package needs a new element or port operation. A refusal keeps the decision open: don't add the package provisionally, and don't hand-write a replacement unless the user chooses that.

## Checking

Before a change is verified, compare the diff of every place dependencies are declared with the records in the feature, the change, its deviations and the architecture: manifests such as `Cargo.toml` or `package.json`, CMake `FetchContent` and `find_package` calls, `.gitmodules`, and third-party code copied into the tree.

- A significant package without the user's approval is a blocker, even when the build passes. Any other new package without a row, fact or deviation is a finding.
- Features, declarations of a package the project already uses, and lockfile churn need no record.
- Done when you can list each new package next to its record.
