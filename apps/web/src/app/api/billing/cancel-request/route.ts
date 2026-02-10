import { NextRequest } from "next/server";

import { cancellationRequestSchema } from "@web3homeoffice/shared";

import { fail, ok } from "@/lib/api/responses";
import { getUserSubscription } from "@/lib/auth/guards";
import { requireUser } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/supabase";

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const payload = cancellationRequestSchema.parse(await request.json());
    const subscription = await getUserSubscription(user.id);

    const insertPayload: Database["public"]["Tables"]["cancellation_requests"]["Insert"] = {
      user_id: user.id,
      subscription_id: subscription?.creem_subscription_id ?? null,
      reason: payload.reason,
      status: "open"
    };

    const admin = createSupabaseAdminClient();
    const { error } = await admin.from("cancellation_requests").insert(insertPayload);

    if (error) {
      throw new Error(`Failed to create cancellation request: ${error.message}`);
    }

    return ok({ requested: true });
  } catch (error) {
    return fail(error);
  }
}
