import { academyProgressUpsertSchema } from "@web3homeoffice/shared";

import { fail, ok } from "@/lib/api/responses";
import { createAcademyActivityLog } from "@/lib/academy/logs";
import { listAcademyProgressForUser, upsertAcademyProgress } from "@/lib/academy/progress";
import { requireActiveSubscriptionForApi } from "@/lib/auth/guards";
import { requireUser } from "@/lib/auth/session";

export async function GET() {
  try {
    const user = await requireUser();
    const progress = await listAcademyProgressForUser(user.id);

    return ok({ progress });
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    await requireActiveSubscriptionForApi(user.id);
    const payload = academyProgressUpsertSchema.parse(await request.json());

    const progress = await upsertAcademyProgress({
      userId: user.id,
      roomId: payload.roomId,
      toolId: payload.toolId,
      status: payload.status,
      score: payload.score
    });

    await createAcademyActivityLog({
      userId: user.id,
      roomId: payload.roomId,
      toolId: payload.toolId,
      eventType: "progress_updated",
      metadata: {
        status: payload.status,
        score: payload.score ?? null
      }
    });

    return ok({ progress });
  } catch (error) {
    return fail(error);
  }
}
