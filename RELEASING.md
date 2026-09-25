# Releasing

Releases are published to npm as `@printpractical/cruze` by `.github/workflows/publish.yml` when a `v*` tag is pushed.

## Installing from GitHub

A pushed tag is installable without npm: `npm install -g github:PrintPractical/cruze#v<version>`. The `prepare` script builds `dist/` during a git install, so every tag must pass `npm run check`. Users who install this way run `cruze init --package github:PrintPractical/cruze#v<version>`, so the CI it writes runs the same source.

## One-time setup

1. Publish the first version by hand, because npm only accepts a trusted publisher for a package that already exists. From a clean checkout of `main` whose `package.json` holds that version, run `npm ci`, `npm run check`, `npm login`, then `npm publish --access public`. Tag it with `git tag v<version>` and push the tag with `git push origin v<version>`; the workflow sees the version is already published and skips it.
2. On npmjs.com, open the package settings and add a trusted publisher:
   - GitHub repository: `PrintPractical/cruze`
   - Workflow: `publish.yml`
   - Environment: `npm`
3. Optionally, require a reviewer on the `npm` environment in the GitHub repository settings.

## Each release

1. Move the `[Unreleased]` entries in `CHANGELOG.md` under a new version heading.
2. Run `npm version <patch|minor|major>`. This updates `package.json` and creates the `v<version>` tag.
3. Push the commit and the tag with `git push --follow-tags`.

The workflow runs `npm run check`, confirms the tag matches `package.json`, and publishes with provenance, unless that version is already on npm.
