import { NextRequest } from "next/server";
import { z } from "zod";

import { fail, ok } from "@/lib/api/responses";
import { requireAdmin } from "@/lib/auth/guards";
import { requireUser } from "@/lib/auth/session";
import { retryProvisionJobByAdmin } from "@/lib/provisioning/jobs";

const payloadSchema = z.object({
  jobId: z.string().uuid()
});

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    await requireAdmin(user.id);

    const payload = payloadSchema.parse(await request.json());
    await retryProvisionJobByAdmin(payload.jobId, user.id);

    return ok({ retried: true });
  } catch (error) {
    return fail(error);
  }
}
