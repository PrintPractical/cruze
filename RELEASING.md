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

`main` takes changes only through pull requests, so a release is prepared on a branch and tagged once it merges.

1. From an up-to-date `main`, create a branch such as `release-<version>`.
2. Run `npm version <version> --no-git-tag-version`. This updates `package.json` and `package-lock.json` without tagging a commit that may never reach `main`.
3. Set `cruze:` and `standards:` in `examples/console-access/.cruze/config.yaml` to the version.
4. Move the `[Unreleased]` entries in `CHANGELOG.md` under a new `## [<version>] - <date>` heading, and update the compare links at the bottom.
5. Update the version in the README's install commands and status line.
6. Check that `skills/realign/notes/<version>.md` has a note for every user-visible change in the release, including those for new work only.
7. Run `npm run check`, commit with a message such as `chore: release <version>`, and open a pull request.
8. Once it merges, tag the merge commit on `main` and push only the tag:

   ```sh
   git checkout main && git pull --ff-only
   git tag v<version>
   git push origin v<version>
   ```

The workflow runs `npm run check`, confirms the tag matches `package.json`, creates the GitHub Release with the package attached, and, when `NPM_PUBLISH` is `true`, publishes to npm with provenance unless that version is already there.
