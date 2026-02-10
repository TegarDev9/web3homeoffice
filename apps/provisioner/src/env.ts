import { z } from "zod";

const envSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(10),
  POLL_INTERVAL_MS: z.coerce.number().default(10000),
  WORKER_BATCH_SIZE: z.coerce.number().default(3),

  TENCENT_SECRET_ID: z.string().min(10),
  TENCENT_SECRET_KEY: z.string().min(10),
  TENCENT_REGION: z.string().default("ap-singapore"),

  LIGHTHOUSE_BUNDLE_ID: z.string().default("bundle_lighthouse_small"),
  LIGHTHOUSE_BLUEPRINT_ID: z.string().default("lhbp_ubuntu_2204"),
  LIGHTHOUSE_BLUEPRINT_ID_UBUNTU: z.string().optional(),
  LIGHTHOUSE_BLUEPRINT_ID_DEBIAN: z.string().optional(),
  LIGHTHOUSE_BLUEPRINT_ID_KALI: z.string().optional(),
  LIGHTHOUSE_ZONE: z.string().default("ap-singapore-1"),
  LIGHTHOUSE_INSTANCE_TYPE: z.string().default("SML_2CORE_2G")
});

type ParsedProvisionerEnv = z.infer<typeof envSchema>;
export type ProvisionerEnv = ParsedProvisionerEnv & {
  LIGHTHOUSE_BLUEPRINT_ID_UBUNTU: string;
  LIGHTHOUSE_BLUEPRINT_ID_DEBIAN: string;
  LIGHTHOUSE_BLUEPRINT_ID_KALI: string;
};

let cachedEnv: ProvisionerEnv | null = null;

export function getEnv() {
  if (cachedEnv) return cachedEnv;
  const parsed = envSchema.parse(process.env);
  cachedEnv = {
    ...parsed,
    LIGHTHOUSE_BLUEPRINT_ID_UBUNTU:
      parsed.LIGHTHOUSE_BLUEPRINT_ID_UBUNTU ?? parsed.LIGHTHOUSE_BLUEPRINT_ID,
    LIGHTHOUSE_BLUEPRINT_ID_DEBIAN:
      parsed.LIGHTHOUSE_BLUEPRINT_ID_DEBIAN ?? parsed.LIGHTHOUSE_BLUEPRINT_ID,
    LIGHTHOUSE_BLUEPRINT_ID_KALI:
      parsed.LIGHTHOUSE_BLUEPRINT_ID_KALI ?? parsed.LIGHTHOUSE_BLUEPRINT_ID
  };
  return cachedEnv;
}


