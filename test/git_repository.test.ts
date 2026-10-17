import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, describe, it } from "node:test";
import { GitRepository } from "../src/adapters/outbound/git_repository.ts";

const dirs: string[] = [];
after(() => dirs.forEach((dir) => rmSync(dir, { recursive: true, force: true })));

describe("the git repository adapter", () => {
  it("names the approver from the repository's user name and email", async () => {
    const repo = mkdtempSync(join(tmpdir(), "cruze-git-"));
    dirs.push(repo);
    execFileSync("git", ["init", "-q", "-b", "main"], { cwd: repo, stdio: "ignore" });
    execFileSync("git", ["config", "user.name", "Test"], { cwd: repo });
    execFileSync("git", ["config", "user.email", "test@example.com"], { cwd: repo });
    assert.equal(await new GitRepository(repo).userName(), "Test <test@example.com>");
  });
});
