import { spawn } from "node:child_process";

const isCi = process.argv.includes("--ci");
const projectName = process.env.CF_PAGES_PROJECT_NAME?.trim();
const branch = process.env.CF_PAGES_BRANCH?.trim();
const commitHash = process.env.CF_PAGES_COMMIT_HASH?.trim();
const commitMessage = process.env.CF_PAGES_COMMIT_MESSAGE?.trim();

if (isCi && !projectName) {
  console.error("CF_PAGES_PROJECT_NAME is required when running with --ci.");
  process.exit(1);
}

const args = ["exec", "wrangler", "pages", "deploy", "out"];

if (projectName) {
  args.push("--project-name", projectName);
}

if (branch) {
  args.push("--branch", branch);
}

if (commitHash) {
  args.push("--commit-hash", commitHash);
}

if (commitMessage) {
  args.push("--commit-message", commitMessage);
}

const command = process.platform === "win32" ? "pnpm.cmd" : "pnpm";

const child = spawn(command, args, {
  stdio: "inherit"
});

child.on("error", (error) => {
  console.error(error.message);
  process.exit(1);
});

child.on("exit", (code) => {
  process.exit(code ?? 1);
});
