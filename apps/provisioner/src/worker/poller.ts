import { getEnv } from "../env";
import { log } from "../logger";
import { LighthouseProvisionProvider } from "../providers/lighthouse";
import { dequeue } from "./dequeue";
import { processJob } from "./processor";

let timer: NodeJS.Timeout | null = null;

export function startPoller() {
  const env = getEnv();
  const provider = new LighthouseProvisionProvider();

  const tick = async () => {
    try {
      const jobs = await dequeue(env.WORKER_BATCH_SIZE);

      if (!jobs.length) {
        log("info", "No pending jobs in queue");
        return;
      }

      log("info", "Dequeued jobs", { count: jobs.length });

      for (const job of jobs) {
        try {
          await processJob(provider, job);
          log("info", "Job completed", { jobId: job.id });
        } catch (error) {
          log("error", "Job failed", {
            jobId: job.id,
            message: error instanceof Error ? error.message : "unknown"
          });
        }
      }
    } catch (error) {
      log("error", "Poller tick failed", {
        message: error instanceof Error ? error.message : "unknown"
      });
    }
  };

  void tick();
  timer = setInterval(() => void tick(), env.POLL_INTERVAL_MS);

  return () => {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  };
}


