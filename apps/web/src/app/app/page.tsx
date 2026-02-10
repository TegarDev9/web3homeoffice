import { redirect } from "next/navigation";

import { OfficeHubClient } from "@/components/hub/OfficeHubClient";
import { ensureProfileForUser } from "@/lib/auth/admin-bootstrap";
import { requireActiveSubscription } from "@/lib/auth/guards";
import { requireUser } from "@/lib/auth/session";
import { listProvisionJobsForUser } from "@/lib/provisioning/jobs";

export default async function AppPage() {
  let user;

  try {
    user = await requireUser();
  } catch {
    redirect("/");
  }

  await ensureProfileForUser(user);
  const subscription = await requireActiveSubscription(user.id);
  const jobs = await listProvisionJobsForUser(user.id);

  return (
    <OfficeHubClient
      userEmail={user.email ?? "anonymous"}
      subscriptionStatus={subscription.status}
      jobs={jobs.map((job) => ({ id: job.id, status: job.status, logs: job.logs }))}
    />
  );
}


