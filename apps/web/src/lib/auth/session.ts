import type { User } from "@supabase/supabase-js";

import { AppError } from "@/lib/api/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ProfileRow } from "@/types/db";

export async function getCurrentUser() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error) throw new AppError(error.message, 401, "AUTH_ERROR");
  return data.user;
}

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) throw new AppError("Authentication required", 401, "UNAUTHORIZED");
  return user;
}

export async function getCurrentProfile(userId: string): Promise<ProfileRow | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("user_id,handle,role,created_at,updated_at")
    .eq("user_id", userId)
    .maybeSingle<ProfileRow>();

  if (error) throw new AppError(error.message, 500, "PROFILE_READ_FAILED");
  return data;
}


