# Evaluating a library

Gather this for each serious candidate, from the registry and the repository during this session. Fill a table like the one below, one column per candidate, and leave out rows that don't apply.

| Question | Where to look | What counts against it |
| --- | --- | --- |
| Fit: does it cover the requirements, and what is missing? | Its docs and examples, checked against the capability's requirements | Missing a stated requirement; needs a fork or heavy wrapping |
| License | The license file in the repository and the registry metadata | Incompatible with the project's license or the vision's constraints |
| Maintenance | Latest release and its date, release cadence, time to respond to issues, number of maintainers | No release in a year with open bugs; one maintainer who has stopped responding |
| Adoption | Downloads, reverse dependencies, notable users | Few users outside its author |
| Footprint | Transitive dependencies, binary or bundle size, native code, build requirements (a C compiler, OpenSSL, a code generator) | Pulls in far more than the capability needs; breaks the platform constraints |
| Security | The ecosystem's advisory database (RustSec, GitHub advisories, `npm audit`, OSV) | Unfixed advisories; a history of slow fixes |
| Integration | Which adapter would own it, and whether its types can stay behind a port | Its types would have to leak into the domain or the application |
| Stability | Major version, stated stability policy, recent breaking changes | Frequent breaking changes in minor releases |

## Writing the recommendation

- Name the release you evaluated and the date you checked it.
- Give the deciding reason in one sentence, and the main cost of the choice.
- For a `build` decision, give the concrete reason from the research skill's list and the rough size of the code to own.

```markdown
| Component | Decision | Choice | Reason |
| --- | --- | --- | --- |
| SSH transport | adopt | `russh` <version> | Pure Rust, so no OpenSSL on macOS; maintained, Apache-2.0. `ssh2` needs libssh2. See `.cruze/notes/2026-09-25-ssh-libraries.md` |
| Serial line settings (`115200 8N1`) | build | | A product-specific notation of three fields that no library parses; about 30 lines to own (D3, the user's decision) |
```
