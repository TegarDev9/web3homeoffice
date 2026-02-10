import { dequeueProvisionJobs } from "../supabase";

export async function dequeue(batchSize: number) {
  return dequeueProvisionJobs(batchSize);
}


