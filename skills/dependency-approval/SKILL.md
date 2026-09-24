---
name: cruze-dependency-approval
description: The rule that no dependency enters a Cruze project without the user's explicit approval, with how to ask for one and where to record it. Use when a design or plan would add a library, package, crate, framework, build or test tool, or vendored code; before editing a dependency manifest; when a build finds it needs something the design didn't name; and when reviewing a diff that changes dependency declarations.
---

# Dependency approval

Every new dependency needs the user's explicit approval before it is declared or relied on. That includes runtime libraries, development and test tools, build plugins, and vendored or copied third-party code. Changing how it is acquired, such as vendoring, a git submodule or copying files, doesn't get around the rule.

## Asking

1. Establish the need: the capability, and why the standard library and the project's already-approved dependencies don't provide it.
2. Choose a recommendation, following `.agents/skills/cruze-research/SKILL.md`, which also says where versions come from.
3. Say where it will sit: the module that owns it, and the port that keeps it out of the core when it is infrastructure.
4. Name the realistic alternatives, including writing it yourself and what owning that code would cost. Never offer a hand-written alternative for cryptography, TLS or a security protocol.
5. Ask, then wait. Nothing is declared, installed or written against it until the user answers.

```markdown
**Dependency: `russh` for SSH hops**
- Why not std or existing: the standard library has no SSH client, and no approved dependency provides one.
- Checked: <version from the registry> (released <date>), Apache-2.0, <release cadence>, pure Rust, <n> transitive crates.
- Sits in: ADP-access.ssh-connector, behind PORT-access.hop-connector.
- Alternatives: `ssh2` binds libssh2 (C, needs OpenSSL on macOS); shelling out to `ssh` loses error detail.
Recommended: adopt `russh`. Approve?
```

## What counts as approval

- The user names the dependency ("use serde"), or approves a design whose `## Adopt or build` table or `Adopts` fact names it. Approving a feature doesn't cover a dependency its design doesn't name, so the design walkthrough lists every new dependency out loud.
- An approval covers the package's ordinary transitive dependencies, and later use for the same purpose in the same package or workspace member.
- It doesn't cover another workspace member, a different purpose, or turning on native code, a network service or new platform requirements. Ask again for those.
- Routine version upgrades follow the project's upgrade policy, not this rule. Point out upgrades that change licensing, platforms or behaviour.
- Researching, reading docs or source, and comparing options need no approval.

## Recording

- A feature or standalone change records it as a row in `## Adopt or build`: the component, `adopt`, the package, and the reason. The adapter that uses it carries an `Adopts` fact in the architecture delta.
- At project scope, the adapter's `Adopts` fact in `docs/architecture.md` records it, and a dependency no adapter owns, such as a test framework or a build tool, goes in the walking-skeleton change's `## Adopt or build`. A choice that is hard to reverse, such as an async runtime, a framework or a database, also gets an ADR.
- Choosing to build commodity functionality is also the user's call: a parser, serializer, protocol codec, CLI parser, URL or version handling, retries, compression, or date and time handling. Record it as a `build` row with the concrete reason for owning the code.
- When a build finds it needs a dependency the design didn't name, stop the task and ask as above. An approval changes the design, so record it through the rethink step at feature level, or at change level for a standalone change. A refusal keeps the decision open: don't add the package provisionally, and don't hand-write a replacement unless the user chooses that.

## Checking

Before a change is verified, compare the diff of every place dependencies are declared with the approvals recorded in the feature, the change and the architecture. That includes manifests such as `package.json`, `Cargo.toml`, `go.mod`, `pyproject.toml`, `vcpkg.json` and `conanfile.*`, CMake `FetchContent` and `find_package` calls, `.gitmodules`, and third-party code copied into the tree.

- Every new direct dependency has a record. An unrecorded one is a blocker, even when the build passes.
- Lockfile churn alone isn't a new dependency.
- Done when you can list each new direct dependency next to the row or fact that approved it.
