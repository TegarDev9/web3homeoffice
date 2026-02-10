import { fail, ok } from "@/lib/api/responses";
import { getAcademyAccessContext } from "@/lib/academy/access";
import { listAcademyRoomSummaries, resolveAcademyLanguage } from "@/lib/academy/catalog";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const language = resolveAcademyLanguage(url.searchParams.get("lang"));
    const access = await getAcademyAccessContext();
    const rooms = await listAcademyRoomSummaries({
      accessLevel: access.accessLevel,
      language
    });

    return ok({
      accessLevel: access.accessLevel,
      language,
      rooms
    });
  } catch (error) {
    return fail(error);
  }
}
