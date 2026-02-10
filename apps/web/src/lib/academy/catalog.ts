import type { AcademyRoomId } from "@web3homeoffice/shared";

import { AppError } from "@/lib/api/errors";
import type {
  AcademyPcStationCatalog,
  AcademyRoomCatalog,
  AcademyToolCatalog,
  AcademyLanguage
} from "@/lib/academy/types";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { AcademyPcStationRow, AcademyRoomRow, AcademyToolRow } from "@/types/db";
import type { Json } from "@/types/supabase";

function toRecord(input: Json): Record<string, unknown> {
  if (!input || typeof input !== "object" || Array.isArray(input)) return {};
  return input as Record<string, unknown>;
}

function toVec3(input: Json, fallback: [number, number, number]): [number, number, number] {
  if (!Array.isArray(input) || input.length < 3) return fallback;
  const x = Number(input[0]);
  const y = Number(input[1]);
  const z = Number(input[2]);
  if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) return fallback;
  return [x, y, z];
}

function localize(
  idValue: string,
  enValue: string,
  language: AcademyLanguage
): { primary: string; secondary: string } {
  if (language === "en") {
    return { primary: enValue, secondary: idValue };
  }
  return { primary: idValue, secondary: enValue };
}

function mapTool(tool: AcademyToolRow, language: AcademyLanguage): AcademyToolCatalog {
  const name = localize(tool.name_id, tool.name_en, language);
  const description = localize(tool.description_id, tool.description_en, language);

  return {
    id: tool.id,
    roomId: tool.room_id,
    toolKey: tool.tool_key,
    name: name.primary,
    subtitle: name.secondary,
    description: description.primary,
    descriptionSecondary: description.secondary,
    category: tool.category,
    difficulty: tool.difficulty,
    isMemberOnly: tool.is_member_only,
    actionKind: tool.action_kind,
    actionPayload: toRecord(tool.action_payload),
    sortOrder: tool.sort_order
  };
}

function mapRoom(room: AcademyRoomRow, language: AcademyLanguage): AcademyRoomCatalog {
  const title = localize(room.title_id, room.title_en, language);
  const summary = localize(room.summary_id, room.summary_en, language);

  return {
    id: room.id,
    slug: room.slug,
    marker: room.marker,
    title: title.primary,
    subtitle: title.secondary,
    summary: summary.primary,
    summarySecondary: summary.secondary,
    theme: toRecord(room.theme),
    position: toVec3(room.position, [0, 0, 0]),
    sortOrder: room.sort_order,
    isPublicPreview: room.is_public_preview,
    tools: [],
    pcStations: []
  };
}

function mapPcStation(station: AcademyPcStationRow): AcademyPcStationCatalog {
  return {
    id: station.id,
    roomId: station.room_id,
    label: station.label,
    modelKey: station.model_key,
    position: toVec3(station.position, [0, 0, 0]),
    rotation: toVec3(station.rotation, [0, 0, 0]),
    specs: toRecord(station.specs)
  };
}

export async function listAcademyRoomsWithContent(params: {
  accessLevel: "preview" | "member";
  language: AcademyLanguage;
}) {
  const admin = createSupabaseAdminClient();

  const [roomsResult, toolsResult, stationsResult] = await Promise.all([
    admin
      .from("academy_rooms")
      .select(
        "id,slug,title_id,title_en,summary_id,summary_en,theme,position,marker,sort_order,is_public_preview,created_at,updated_at"
      )
      .order("sort_order", { ascending: true })
      .returns<AcademyRoomRow[]>(),
    admin
      .from("academy_tools")
      .select(
        "id,room_id,tool_key,name_id,name_en,description_id,description_en,category,difficulty,is_member_only,action_kind,action_payload,sort_order,created_at,updated_at"
      )
      .order("sort_order", { ascending: true })
      .returns<AcademyToolRow[]>(),
    admin
      .from("academy_pc_stations")
      .select("id,room_id,label,model_key,position,rotation,specs,created_at,updated_at")
      .returns<AcademyPcStationRow[]>()
  ]);

  if (roomsResult.error) {
    throw new AppError(roomsResult.error.message, 500, "ACADEMY_ROOMS_READ_FAILED");
  }
  if (toolsResult.error) {
    throw new AppError(toolsResult.error.message, 500, "ACADEMY_TOOLS_READ_FAILED");
  }
  if (stationsResult.error) {
    throw new AppError(stationsResult.error.message, 500, "ACADEMY_STATIONS_READ_FAILED");
  }

  const rooms = (roomsResult.data ?? [])
    .filter((room) => params.accessLevel === "member" || room.is_public_preview)
    .map((room) => mapRoom(room, params.language));

  const roomMap = new Map(rooms.map((room) => [room.id, room]));
  const tools = toolsResult.data ?? [];
  const stations = stationsResult.data ?? [];

  for (const tool of tools) {
    const room = roomMap.get(tool.room_id);
    if (!room) continue;
    if (params.accessLevel === "preview" && tool.is_member_only) continue;
    room.tools.push(mapTool(tool, params.language));
  }

  for (const station of stations) {
    const room = roomMap.get(station.room_id);
    if (!room) continue;
    room.pcStations.push(mapPcStation(station));
  }

  return rooms.map((room) => ({
    ...room,
    tools: room.tools.sort((a, b) => a.sortOrder - b.sortOrder)
  }));
}

export async function listAcademyRoomSummaries(params: {
  accessLevel: "preview" | "member";
  language: AcademyLanguage;
}) {
  const rooms = await listAcademyRoomsWithContent(params);
  return rooms.map((room) => ({
    id: room.id,
    slug: room.slug,
    marker: room.marker,
    title: room.title,
    subtitle: room.subtitle,
    summary: room.summary,
    summarySecondary: room.summarySecondary,
    theme: room.theme,
    position: room.position,
    sortOrder: room.sortOrder,
    isPublicPreview: room.isPublicPreview,
    toolCount: room.tools.length
  }));
}

export async function getAcademyRoomDetail(params: {
  roomId: AcademyRoomId;
  accessLevel: "preview" | "member";
  language: AcademyLanguage;
}) {
  const rooms = await listAcademyRoomsWithContent({
    accessLevel: params.accessLevel,
    language: params.language
  });
  return rooms.find((room) => room.id === params.roomId) ?? null;
}

export async function getAcademyToolById(toolId: string) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("academy_tools")
    .select(
      "id,room_id,tool_key,name_id,name_en,description_id,description_en,category,difficulty,is_member_only,action_kind,action_payload,sort_order,created_at,updated_at"
    )
    .eq("id", toolId)
    .maybeSingle<AcademyToolRow>();

  if (error) {
    throw new AppError(error.message, 500, "ACADEMY_TOOL_READ_FAILED");
  }

  return data;
}

export function resolveAcademyLanguage(value: string | null | undefined): AcademyLanguage {
  if (value === "en") return "en";
  return "id";
}
