import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = path.dirname(fileURLToPath(import.meta.url));

export function buildBootstrapScript(template: "vps-base" | "rpc-placeholder", options?: { sshPublicKey?: string }) {
  const basePath = path.resolve(currentDir, "../templates/vps-base.sh");
  const rpcPath = path.resolve(currentDir, "../templates/rpc-placeholder.sh");

  const base = readFileSync(basePath, "utf-8");
  const rpc = readFileSync(rpcPath, "utf-8");

  const lines = [base];

  if (options?.sshPublicKey) {
    lines.push(
      `mkdir -p /home/web3ho/.ssh`,
      `echo '${options.sshPublicKey.replace(/'/g, "'\\''")}' > /home/web3ho/.ssh/authorized_keys`,
      "chown -R web3ho:web3ho /home/web3ho/.ssh",
      "chmod 700 /home/web3ho/.ssh",
      "chmod 600 /home/web3ho/.ssh/authorized_keys"
    );
  }

  if (template === "rpc-placeholder") {
    lines.push(rpc);
  }

  return `${lines.join("\n\n")}\n`;
}


