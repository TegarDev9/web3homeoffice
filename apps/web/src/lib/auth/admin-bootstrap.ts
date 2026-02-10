import { createHash } from "node:crypto";

import type { User } from "@supabase/supabase-js";

import { getAdminBootstrapEmails } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/supabase";

export async function ensureProfileForUser(user: User) {
  const admin = createSupabaseAdminClient();
  const email = user.email?.toLowerCase() ?? "";
  const defaultHandle = email ? email.split("@")[0] : `user-${user.id.slice(0, 8)}`;
  const bootstrapEmails = getAdminBootstrapEmails();
  const role: "admin" | "user" = bootstrapEmails.has(email) ? "admin" : "user";

  const payload: Database["public"]["Tables"]["profiles"]["Insert"] = {
    user_id: user.id,
    handle: sanitizeHandle(defaultHandle),
    role
  };

  const { error } = await admin.from("profiles").upsert(payload, { onConflict: "user_id" });

  if (error) {
    throw new Error(`Failed to upsert profile: ${error.message}`);
  }
}

function sanitizeHandle(input: string) {
  const slug = input.replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 24);
  if (slug.length >= 3) return slug;
  return `user-${createHash("sha1").update(input).digest("hex").slice(0, 10)}`;
}


