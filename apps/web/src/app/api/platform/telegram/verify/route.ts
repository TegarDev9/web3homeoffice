import { NextRequest } from "next/server";
import { z } from "zod";

import { fail, ok } from "@/lib/api/responses";
import { AppError } from "@/lib/api/errors";
import { getServerEnv } from "@/lib/env";
import { requireUser } from "@/lib/auth/session";
import { verifyTelegramInitData } from "@/lib/platforms/telegram-verify";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/supabase";

const bodySchema = z.object({
  initData: z.string().min(10)
});

export async function POST(request: NextRequest) {
  try {
    const env = getServerEnv();
    if (!env.TELEGRAM_BOT_TOKEN) {
      throw new AppError("TELEGRAM_BOT_TOKEN is not configured", 500, "TELEGRAM_NOT_CONFIGURED");
    }

    const user = await requireUser();
    const payload = bodySchema.parse(await request.json());
    const verified = verifyTelegramInitData(payload.initData, env.TELEGRAM_BOT_TOKEN);

    const admin = createSupabaseAdminClient();
    const record: Database["public"]["Tables"]["platform_accounts"]["Insert"] = {
      user_id: user.id,
      platform: "telegram",
      platform_user_id: String(verified.user.id),
      username: verified.user.username ?? null,
      metadata: {
        auth_date: verified.authDate ?? null,
        first_name: verified.user.first_name ?? null,
        last_name: verified.user.last_name ?? null
      }
    };
    const { error } = await admin
      .from("platform_accounts")
      .upsert(record, { onConflict: "platform,platform_user_id" });

    if (error) throw error;

    return ok({ linked: true });
  } catch (error) {
    return fail(error);
  }
}


