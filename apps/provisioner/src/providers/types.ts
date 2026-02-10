import type { ProvisionJob } from "../supabase";

export type ProvisionResult = {
  instanceId: string;
  publicIp: string | null;
  metadata?: Record<string, unknown>;
};

export interface ProvisionProvider {
  createInstance(job: ProvisionJob): Promise<ProvisionResult>;
  bootstrapInstance(job: ProvisionJob, instanceId: string, script: string): Promise<void>;
}


