# The manual test script

`manual-test.md` in the change folder is what a person runs to see the change work with their own eyes. Write it for someone who knows the product but not the code.

```markdown
# Manual test: <change title>

Setup, once:
1. <build or install command, from the project's commands>
2. <any configuration file to create, with its full content>

## SCN-<id>: <scenario title>
1. <exact command or action>
2. <next action>
Expected: <what they see, quoted from the scenario's THEN>
Verifier: pass | fail | could not run (<what it needs>)
```

- One section per scenario the change delivers, in the order of the spec delta.
- Every step is a command they can paste or an action they can take, with real values.
- Expected results are quoted from the scenario.
- Scenarios the verifier couldn't run come first, since they carry the most risk. Say what each needs, such as a serial device or a jump host.
- Finish with how to clean up anything the setup created.
