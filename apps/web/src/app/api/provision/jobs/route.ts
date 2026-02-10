import { fail, ok } from "@/lib/api/responses";
import { requireUser } from "@/lib/auth/session";
import { listProvisionJobsForUser } from "@/lib/provisioning/jobs";

export async function GET() {
  try {
    const user = await requireUser();
    const jobs = await listProvisionJobsForUser(user.id);
    return ok({ jobs });
  } catch (error) {
    return fail(error);
  }
}


