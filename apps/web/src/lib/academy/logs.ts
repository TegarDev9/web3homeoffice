import type { AcademyRoomId } from "@web3homeoffice/shared";

import { AppError } from "@/lib/api/errors";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { AcademyActivityLogRow } from "@/types/db";
import type { Database, Json } from "@/types/supabase";

export async function createAcademyActivityLog(params: {
  userId?: string | null;
  roomId: AcademyRoomId;
  toolId?: string | null;
  eventType: string;
  metadata?: Json;
}) {
  const admin = createSupabaseAdminClient();
  const payload: Database["public"]["Tables"]["academy_activity_logs"]["Insert"] = {
    user_id: params.userId ?? null,
    room_id: params.roomId,
    tool_id: params.toolId ?? null,
    event_type: params.eventType,
    metadata: params.metadata ?? {}
  };

  const { error } = await admin.from("academy_activity_logs").insert(payload);
  if (error) {
    throw new AppError(error.message, 500, "ACADEMY_LOG_CREATE_FAILED");
  }
}

export async function listAcademyActivityLogsForUser(userId: string, limit = 100) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("academy_activity_logs")
    .select("id,user_id,room_id,tool_id,event_type,metadata,created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit)
    .returns<AcademyActivityLogRow[]>();

  if (error) {
    throw new AppError(error.message, 500, "ACADEMY_LOG_READ_FAILED");
  }

  return data ?? [];
}
