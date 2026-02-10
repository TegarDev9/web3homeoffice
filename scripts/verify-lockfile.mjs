import { accessSync, constants } from "node:fs";
import { spawnSync } from "node:child_process";

const LOCKFILE = "pnpm-lock.yaml";

function fail(message) {
  console.error(`[ci:verify-lockfile] ${message}`);
  process.exit(1);
}

function runGit(args) {
  return spawnSync("git", args, { encoding: "utf8" });
}

try {
  accessSync(LOCKFILE, constants.F_OK);
} catch {
  fail(`Missing ${LOCKFILE}. Commit the lockfile before running CI.`);
}

const ignoredResult = runGit(["check-ignore", "-q", LOCKFILE]);
if (ignoredResult.status === 0) {
  fail(`${LOCKFILE} is ignored by git. Remove ignore rules before CI.`);
}
if (ignoredResult.status !== 1) {
  const details = (ignoredResult.stderr || ignoredResult.stdout || "").trim();
  fail(`Unable to verify ignore state for ${LOCKFILE}${details ? `: ${details}` : "."}`);
}

const trackedResult = runGit(["ls-files", "--error-unmatch", LOCKFILE]);
if (trackedResult.status !== 0) {
  const details = (trackedResult.stderr || trackedResult.stdout || "").trim();
  fail(`${LOCKFILE} is not tracked by git. Add and commit it before CI${details ? ` (${details})` : "."}`);
}

console.log(`[ci:verify-lockfile] OK: ${LOCKFILE} exists, is not ignored, and is tracked.`);
