import { NextRequest } from "next/server";

import { fail, ok } from "@/lib/api/responses";
import { requireAdmin } from "@/lib/auth/guards";
import { requireUser } from "@/lib/auth/session";
import { listProvisionJobsAdmin } from "@/lib/provisioning/jobs";

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser();
    await requireAdmin(user.id);

    const limit = Number(request.nextUrl.searchParams.get("limit") ?? "100");
    const jobs = await listProvisionJobsAdmin(limit);

    return ok({ jobs });
  } catch (error) {
    return fail(error);
  }
}


