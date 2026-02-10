import { getEnv } from "./env";
import { log } from "./logger";
import { startPoller } from "./worker/poller";

function main() {
  const env = getEnv();
  log("info", "Provisioner worker started", {
    region: env.TENCENT_REGION,
    intervalMs: env.POLL_INTERVAL_MS,
    batchSize: env.WORKER_BATCH_SIZE
  });

  const stop = startPoller();

  const shutdown = () => {
    log("info", "Shutting down provisioner worker");
    stop();
    process.exit(0);
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

main();


