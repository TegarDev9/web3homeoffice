import { ACADEMY_ROOM_IDS } from "@web3homeoffice/shared";

import { AppError } from "@/lib/api/errors";
import { fail, ok } from "@/lib/api/responses";
import { getAcademyAccessContext } from "@/lib/academy/access";
import { getAcademyRoomDetail, resolveAcademyLanguage } from "@/lib/academy/catalog";

export async function GET(
  request: Request,
  context: {
    params: Promise<{ roomId: string }>;
  }
) {
  try {
    const { roomId } = await context.params;
    if (!ACADEMY_ROOM_IDS.includes(roomId as (typeof ACADEMY_ROOM_IDS)[number])) {
      throw new AppError("Invalid academy room id", 400, "ACADEMY_ROOM_INVALID");
    }

    const url = new URL(request.url);
    const language = resolveAcademyLanguage(url.searchParams.get("lang"));
    const access = await getAcademyAccessContext();
    const room = await getAcademyRoomDetail({
      roomId: roomId as (typeof ACADEMY_ROOM_IDS)[number],
      accessLevel: access.accessLevel,
      language
    });

    if (!room) {
      throw new AppError("Academy room not found", 404, "ACADEMY_ROOM_NOT_FOUND");
    }

    return ok({
      accessLevel: access.accessLevel,
      language,
      room
    });
  } catch (error) {
    return fail(error);
  }
}
