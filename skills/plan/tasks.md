# Writing the tasks

A task is one owner, the files it writes, and the IDs it proves. Build does them in order, one red-to-green cycle and one commit each. The grammar and the proving rules are in `.agents/skills/cruze-formats/reference/work-items.md`.

1. **List the owners.** Take every element in the scope, and the owner in code that each one names, from its `File` fact. Add the owners the test plan needs that aren't elements, such as a fake, a test support module or the CI workflow.
2. **Order from the inside out.**
   - Domain types first, then the ports they need.
   - Then the use cases, then the adapters, then the inbound adapter.
   - The composition root comes last.
   - Put fakes just before the first task whose test needs them.
   - Each task's test can fail first and then pass, using only what earlier tasks built.
   - Put each test in the task that builds the behaviour it checks. When an earlier task's code would already pass a later task's test, such as a failure path the earlier task had to handle, move the test into the earlier task.
   - A test that expects a default or empty result, such as no prompt, an empty list, `nil` or `0`, passes against a stub that returns it. Name in the task the break it is first seen failing against, as the wrong behaviour rather than an edit to the code, such as "fails against a model that always shows the prompt". Build may use any break that compiles and turns the same assertion red.
   - When the project's lint rejects unused code, such as `cargo clippy -- -D warnings`, put each new item in the task of its first user, or in a task whose own test uses it. Each task then commits green on its own.
3. **Write one line per task:**

   ```markdown
   - T3: `ConsoleSession` in `src/access/domain/console_session.rs`, proves ENT-access.console-session
   - T7: `OpenConsole` in `src/access/app/open_console.rs`, proves UC-access.open-console, SCN-access.direct-serial
   ```

   - Owner and paths in backticks. Every path is a file the architecture assigns to that owner, or a test or support file. List the test support files the task extends, such as a shared harness or fixture, so its tests reuse them.
   - When a task adds a module, a file or a dependency, list the file that declares it, such as the crate root or `mod.rs`, the package manifest, or the Xcode project.
   - A task proves the elements it builds, and each scenario whose test goes green in it.
   - A task that only sets up tooling proves the flow or scenario its checks run.
4. **Find the callers.** For each signature, default or setting a task changes, search the code for every use of it, including tests that start the real binary or read the setting. Add each file that must change to the task. Done when no task will need a file it doesn't list.
5. **Size each task.** A task writes one owner, with its tests, in one sitting. When an owner would take several steps, such as a use case with many scenarios, split it into tasks that each prove a subset of the scenarios.
   - Run `cruze check` on each existing file a task extends. When the task would take the file past `check.max_lines` or `check.max_types`, name the new file in the task, split along a responsibility the owner already has. When the owner has one responsibility, plan a `check.exceptions` entry with that reason instead of a split, following the budget rule in `.agents/skills/cruze-hexagonal-design/SKILL.md`.
   - The budgets apply to source files, not tests. Split a test file by the behaviour it covers, one use case or port per file, never to meet a budget. Tests that leave a source file go where the hexagonal-design language file you loaded says.
6. **Check coverage.**
   - Every `Builds` ID is proved by a task, except a module, which is proved by any task that writes inside its `Path`.
   - Every delivered scenario is proved by at least one task.
   - Done when `cruze validate` reports no `unproved-scope`, `task-format` or `outside-module-map` problems. An `outside-module-map` warning means a task writes a file no module's `Path` covers: add the file to the owning module's `Path` through `rethink`, or move it.
