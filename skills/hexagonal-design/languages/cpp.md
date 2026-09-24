# C++

These add to the hexagonal design rules for C++ projects. The module map decides the layout; this file never does.

## Files

- Organize headers and sources by the concept they own. Public headers sit under `include/<project>/` only when an outside caller needs them; a type private to one source file has no header.
- `main.cpp` is the composition root: it constructs adapters and use cases, injects dependencies and starts the application.
- Don't create `Domain.hpp`, `Services.cpp`, `Models.hpp` or `Utils.cpp` catch-alls.
- Domain headers expose no application, adapter, framework, OS or third-party infrastructure types.

## Modelling

- Use modern C++ with value semantics, `enum class` for closed sets, small domain classes and value objects with validating constructors.
- Use free functions or concrete classes when behaviour needs no polymorphism. Don't create `IFoo`, `Foo` and `FooImpl` without a substitution purpose.
- Prefer composition over deep inheritance.

## Ports and ownership

- Ports are narrow abstract interfaces owned by the application, used where runtime substitution is useful. They never mirror a third-party SDK.
- Use RAII for every resource. Pass lightweight owned objects by value, transferred exclusive ownership as `std::unique_ptr`, and shared ownership as `std::shared_ptr` only when ownership really is shared. Required dependencies owned elsewhere are references. No raw owning pointers or manual `new` and `delete`.
- Inject dependencies explicitly and wire them in `main.cpp`.

## Errors

- Represent expected domain and application failures explicitly: `std::expected` from C++23, or a small result type the project owns on older standards. Exceptions are not a substitute for modelling failures.
- Catch third-party exceptions in the adapter and translate them. Never let them cross a port.

## Concurrency

- Use threads, executors or queues only when they buy real runtime value, and make shutdown explicit.
- Keep shared mutable state and lock scope small. Avoid needless queues, context switches, allocations and copies on hot paths.

## Dependencies and tooling

- Prefer the standard library, then mature libraries, subject to `.agents/skills/cruze-dependency-approval/SKILL.md`. Weigh portability and build-system impact.
- Use the project's build system and its own tooling. Format with `clang-format` and lint with `clang-tidy` when the project configures them.
