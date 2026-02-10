import { z } from "zod";

const publicEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(10)
});

const serverEnvSchema = publicEnvSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(10),
  CREEM_API_KEY: z.string().min(10),
  CREEM_WEBHOOK_SECRET: z.string().min(10),
  CREEM_MODE: z.enum(["test", "live"]).default("test"),
  CREEM_API_BASE_TEST: z.string().url().optional(),
  CREEM_API_BASE_LIVE: z.string().url().optional(),
  CREEM_WEBHOOK_SIGNATURE_HEADER: z.string().default("x-creem-signature"),
  CREEM_WEBHOOK_SIGNATURE_ALGORITHM: z.string().default("sha256"),
  ADMIN_BOOTSTRAP_EMAILS: z.string().optional(),
  TELEGRAM_BOT_TOKEN: z.string().optional(),
  SUPPORT_EMAIL: z.string().email().optional(),
  ACADEMY_EVM_ENABLED: z.enum(["true", "false"]).optional()
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;
export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cachedPublicEnv: PublicEnv | null = null;
let cachedServerEnv: ServerEnv | null = null;

export function getPublicEnv(): PublicEnv {
  if (cachedPublicEnv) return cachedPublicEnv;
  cachedPublicEnv = publicEnvSchema.parse({
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  });
  return cachedPublicEnv;
}

export function getServerEnv(): ServerEnv {
  if (cachedServerEnv) return cachedServerEnv;
  cachedServerEnv = serverEnvSchema.parse({
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    CREEM_API_KEY: process.env.CREEM_API_KEY,
    CREEM_WEBHOOK_SECRET: process.env.CREEM_WEBHOOK_SECRET,
    CREEM_MODE: process.env.CREEM_MODE,
    CREEM_API_BASE_TEST: process.env.CREEM_API_BASE_TEST,
    CREEM_API_BASE_LIVE: process.env.CREEM_API_BASE_LIVE,
    CREEM_WEBHOOK_SIGNATURE_HEADER: process.env.CREEM_WEBHOOK_SIGNATURE_HEADER,
    CREEM_WEBHOOK_SIGNATURE_ALGORITHM: process.env.CREEM_WEBHOOK_SIGNATURE_ALGORITHM,
    ADMIN_BOOTSTRAP_EMAILS: process.env.ADMIN_BOOTSTRAP_EMAILS,
    TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
    SUPPORT_EMAIL: process.env.SUPPORT_EMAIL,
    ACADEMY_EVM_ENABLED: process.env.ACADEMY_EVM_ENABLED
  });
  return cachedServerEnv;
}

export function getAdminBootstrapEmails() {
  const env = getServerEnv();
  if (!env.ADMIN_BOOTSTRAP_EMAILS) return new Set<string>();
  return new Set(
    env.ADMIN_BOOTSTRAP_EMAILS.split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean)
  );
}

export function getSupportEmail() {
  return getServerEnv().SUPPORT_EMAIL ?? "support@example.com";
}

export function isAcademyEvmEnabled() {
  return getServerEnv().ACADEMY_EVM_ENABLED === "true";
}


