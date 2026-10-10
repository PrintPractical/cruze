# A listing piped into head ended in a stack trace

- Proposal: the CLI exits quietly with code 0 when its reader closes stdout early.
- Evidence: in the rto and ork projects, `cruze journal list --event disposition --json | head -c 300` printed a 16-line `Error: write EPIPE` stack trace on Cruze 0.0.7 whenever the listing exceeded the pipe buffer. Agents piped listings into `head` and `grep` 53 times in rto and 42 in ork.
- Asset: `src/main.ts`

## Situation

A project with 2,000 journal entries runs `cruze journal list --json | head -c 10`.

## Expected

stderr is empty and the exit code is 0.

## Check

A test: `test/cli.test.ts`, "stops quietly when its reader closes the pipe early".
