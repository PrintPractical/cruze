import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, describe, it } from "node:test";
import { GitRepository } from "../src/adapters/outbound/git_repository.ts";

const dirs: string[] = [];
after(() => dirs.forEach((dir) => rmSync(dir, { recursive: true, force: true })));

function git(cwd: string, ...args: string[]): void {
  execFileSync("git", ["-c", "user.name=Test", "-c", "user.email=test@example.com", ...args], { cwd, stdio: "ignore" });
}

describe("the git repository adapter", () => {
  // Ork: `cruze status --overlap` ran a git process per file per branch, and took up to two minutes.
  it("reads a directory's files as they are on another branch, whatever their contents", async () => {
    const repo = mkdtempSync(join(tmpdir(), "cruze-git-"));
    dirs.push(repo);
    git(repo, "init", "-q", "-b", "main");
    git(repo, "commit", "-q", "--allow-empty", "-m", "start");
    git(repo, "checkout", "-q", "-b", "other");
    const files: Record<string, string> = {
      ".cruze/features/a/feature.md": "# Café — ünïcode\n\nline two\n",
      ".cruze/features/a/empty.md": "",
      ".cruze/features/b/no-newline.md": "no newline at the end",
    };
    for (const [path, text] of Object.entries(files)) {
      mkdirSync(join(repo, path, ".."), { recursive: true });
      writeFileSync(join(repo, path), text);
    }
    writeFileSync(join(repo, "outside.md"), "not read\n");
    git(repo, "add", ".");
    git(repo, "commit", "-q", "-m", "work");
    git(repo, "checkout", "-q", "main");

    const read = await new GitRepository(repo).filesOnBranch("other", ".cruze/features");
    assert.deepEqual(Object.fromEntries(read), files);
    assert.deepEqual(await new GitRepository(repo).filesOnBranch("other", ".cruze/changes"), new Map());
  });

  it("finds the commit that first added a text to a file, and reads a file as it was there", async () => {
    const repo = mkdtempSync(join(tmpdir(), "cruze-git-"));
    dirs.push(repo);
    git(repo, "init", "-q", "-b", "main");
    mkdirSync(join(repo, "docs"));
    writeFileSync(join(repo, "docs/a.md"), "first\n");
    writeFileSync(join(repo, "approvals.json"), "{}\n");
    git(repo, "add", ".");
    git(repo, "commit", "-q", "-m", "one");
    writeFileSync(join(repo, "docs/a.md"), "second\n");
    writeFileSync(join(repo, "approvals.json"), "{\"approvedAt\": \"2026-10-11T12:00:00.000Z\"}\n");
    git(repo, "commit", "-q", "-am", "two");
    writeFileSync(join(repo, "docs/a.md"), "third\n");
    git(repo, "commit", "-q", "-am", "three");

    const repository = new GitRepository(repo);
    const commit = await repository.firstCommitAdding("approvals.json", "2026-10-11T12:00:00.000Z");
    assert.ok(commit !== null);
    assert.equal(await repository.fileAt(commit, "docs/a.md"), "second\n");
    assert.equal(await repository.fileAt(commit, "docs/missing.md"), null);
    assert.equal(await repository.firstCommitAdding("approvals.json", "never recorded"), null);
  });
});
