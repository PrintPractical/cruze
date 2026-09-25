# Releasing

Pushing a `v*` tag runs `.github/workflows/publish.yml`. It checks the build, then creates a GitHub Release with the packed package attached, which installs without npm. When the repository variable `NPM_PUBLISH` is `true`, it also publishes to npm as `@printpractical/cruze`.

## Installing without npm

- **Release asset:** `npm install -g https://github.com/PrintPractical/cruze/releases/download/v<version>/printpractical-cruze-<version>.tgz`. The tarball has `dist/` prebuilt.
- **Git:** `npm install -g --install-links github:PrintPractical/cruze#v<version>`. npm runs no build for a git install, so `bin/cruze.mjs` builds `dist/` on the first run with `scripts/build.mjs`, which needs only Node. Keep the package free of install scripts: npm 11 skips them for global installs.

Users who install either way pass the same source to `cruze init --package <spec>`, so the CI it writes runs it too.

## Publishing to npm (optional)

Until this is set up, leave `NPM_PUBLISH` unset; releases then go to GitHub only.

1. Publish the first version by hand, because npm only accepts a trusted publisher for a package that already exists. From a clean checkout of `main` whose `package.json` holds that version, run `npm ci`, `npm run check`, `npm login`, then `npm publish --access public`. Tag it with `git tag v<version>` and push the tag with `git push origin v<version>`; the workflow sees the version is already published and skips it.
2. On npmjs.com, open the package settings and add a trusted publisher:
   - GitHub repository: `PrintPractical/cruze`
   - Workflow: `publish.yml`
   - Environment: `npm`
3. Optionally, require a reviewer on the `npm` environment in the GitHub repository settings.
4. Set the repository variable `NPM_PUBLISH` to `true`.

## Each release

1. Move the `[Unreleased]` entries in `CHANGELOG.md` under a new version heading.
2. Run `npm version <patch|minor|major>`. This updates `package.json` and creates the `v<version>` tag.
3. Push the commit and the tag with `git push --follow-tags`.

The workflow runs `npm run check`, confirms the tag matches `package.json`, creates the GitHub Release with the package attached, and, when `NPM_PUBLISH` is `true`, publishes to npm with provenance unless that version is already there.
