"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

import { getPublicEnv } from "@/lib/env";
import type { Database } from "@/types/supabase";

let client: SupabaseClient<Database> | null = null;

export function createSupabaseBrowserClient() {
  if (client) return client;
  const env = getPublicEnv();
  client = createBrowserClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  return client;
}


