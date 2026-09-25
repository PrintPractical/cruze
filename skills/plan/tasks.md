# Writing the tasks

A task is one owner, the files it writes, and the IDs it proves. Build does them in order, one red-to-green cycle and one commit each. The grammar and the proving rules are in `.agents/skills/cruze-formats/reference/work-items.md`.

1. **List the owners.** Take every element in the scope, and the owner in code that each one names, from its `File` fact. Add the owners the test plan needs that aren't elements, such as a fake, a test support module or the CI workflow.
2. **Order from the inside out.**
   - Domain types first, then the ports they need.
   - Then the use cases, then the adapters, then the inbound adapter.
   - The composition root comes last.
   - Put fakes just before the first task whose test needs them.
   - Each task's test can fail first and then pass, using only what earlier tasks built.
3. **Write one line per task:**

   ```markdown
   - T3: `ConsoleSession` in `src/access/domain/console_session.rs`, proves ENT-access.console-session
   - T7: `OpenConsole` in `src/access/app/open_console.rs`, proves UC-access.open-console, SCN-access.direct-serial
   ```

   - Owner and paths in backticks. Every path is a file the architecture assigns to that owner, or a test or support file.
   - A task proves the elements it builds, and each scenario whose test goes green in it.
   - A task that only sets up tooling proves the flow or scenario its checks run.
4. **Size each task.** A task writes one owner, with its tests, in one sitting. When an owner would take several steps, such as a use case with many scenarios, split it into tasks that each prove a subset of the scenarios.
5. **Check coverage.**
   - Every `Builds` ID is proved by a task, except a module, which is proved by any task that writes inside its `Path`.
   - Every delivered scenario is proved by at least one task.
   - Done when `cruze validate` reports no `unproved-scope` or `task-format` problems.
