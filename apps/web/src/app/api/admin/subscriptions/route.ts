import { NextRequest } from "next/server";

import { fail, ok } from "@/lib/api/responses";
import { requireAdmin } from "@/lib/auth/guards";
import { requireUser } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser();
    await requireAdmin(user.id);

    const limit = Number(request.nextUrl.searchParams.get("limit") ?? "100");
    const admin = createSupabaseAdminClient();

    const { data, error } = await admin
      .from("subscriptions")
      .select("user_id,creem_customer_id,creem_subscription_id,status,current_period_end,plan_id,interval,updated_at")
      .order("updated_at", { ascending: false })
      .limit(limit);

    if (error) throw error;

    return ok({ subscriptions: data });
  } catch (error) {
    return fail(error);
  }
}


