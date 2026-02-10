import type { AcademyProgressStatus, AcademyRoomId } from "@web3homeoffice/shared";

import { AppError } from "@/lib/api/errors";
import type { AcademyProgressItem } from "@/lib/academy/types";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { AcademyUserProgressRow } from "@/types/db";
import type { Database } from "@/types/supabase";

function mapProgress(row: AcademyUserProgressRow): AcademyProgressItem {
  return {
    id: row.id,
    roomId: row.room_id,
    toolId: row.tool_id,
    status: row.status,
    score: row.score,
    lastSeenAt: row.last_seen_at,
    completedAt: row.completed_at
  };
}

export async function listAcademyProgressForUser(userId: string) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("academy_user_progress")
    .select("id,user_id,room_id,tool_id,status,score,last_seen_at,completed_at,created_at,updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .returns<AcademyUserProgressRow[]>();

  if (error) {
    throw new AppError(error.message, 500, "ACADEMY_PROGRESS_READ_FAILED");
  }

  return (data ?? []).map(mapProgress);
}

export async function upsertAcademyProgress(params: {
  userId: string;
  roomId: AcademyRoomId;
  toolId: string;
  status: AcademyProgressStatus;
  score?: number | null;
}) {
  const admin = createSupabaseAdminClient();
  const now = new Date().toISOString();
  const completedAt = params.status === "completed" ? now : null;

  const payload: Database["public"]["Tables"]["academy_user_progress"]["Insert"] = {
    user_id: params.userId,
    room_id: params.roomId,
    tool_id: params.toolId,
    status: params.status,
    score: params.score ?? null,
    last_seen_at: now,
    completed_at: completedAt
  };

  const { data, error } = await admin
    .from("academy_user_progress")
    .upsert(payload, { onConflict: "user_id,room_id,tool_id" })
    .select("id,user_id,room_id,tool_id,status,score,last_seen_at,completed_at,created_at,updated_at")
    .single<AcademyUserProgressRow>();

  if (error || !data) {
    throw new AppError(error?.message ?? "Unable to update progress", 500, "ACADEMY_PROGRESS_UPSERT_FAILED");
  }

  return mapProgress(data);
}
