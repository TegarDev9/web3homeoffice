import { redirect } from "next/navigation";

import { AdminRetryButton } from "@/components/layout/admin-retry-button";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth/guards";
import { requireUser } from "@/lib/auth/session";
import { listProvisionJobsAdmin } from "@/lib/provisioning/jobs";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { formatDate } from "@/lib/utils";
import type { SubscriptionRow } from "@/types/db";

export default async function AdminPage() {
  let user;

  try {
    user = await requireUser();
  } catch {
    redirect("/");
  }

  try {
    await requireAdmin(user.id);
  } catch {
    redirect("/dashboard");
  }

  const admin = createSupabaseAdminClient();
  const [usersResult, subscriptionsResult, jobs] = await Promise.all([
    admin.auth.admin.listUsers({ page: 1, perPage: 50 }),
    admin
      .from("subscriptions")
      .select("user_id,status,plan_id,interval,current_period_end,updated_at")
      .order("updated_at", { ascending: false })
      .limit(50)
      .returns<SubscriptionRow[]>(),
    listProvisionJobsAdmin(50)
  ]);

  if (usersResult.error) throw new Error(usersResult.error.message);
  if (subscriptionsResult.error) throw new Error(subscriptionsResult.error.message);

  const subscriptions = subscriptionsResult.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin"
        description="Users, subscriptions, and provisioning jobs."
        statusLabel="protected"
      />

      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>Supabase auth users (latest 50).</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="text-left text-xs uppercase tracking-[0.1em] text-muted">
              <tr>
                <th className="pb-2">User ID</th>
                <th className="pb-2">Email</th>
                <th className="pb-2">Created</th>
              </tr>
            </thead>
            <tbody>
              {usersResult.data.users.map((item) => (
                <tr key={item.id} className="border-t border-border/40 text-muted">
                  <td className="py-2 font-mono text-xs text-text">{item.id}</td>
                  <td className="py-2">{item.email ?? "-"}</td>
                  <td className="py-2">{formatDate(item.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Subscriptions</CardTitle>
          <CardDescription>Webhook-synced subscription state.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="text-left text-xs uppercase tracking-[0.1em] text-muted">
              <tr>
                <th className="pb-2">User ID</th>
                <th className="pb-2">Status</th>
                <th className="pb-2">Plan</th>
                <th className="pb-2">Interval</th>
                <th className="pb-2">Period End</th>
                <th className="pb-2">Updated</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.map((sub) => (
                <tr key={`${sub.user_id}-${sub.updated_at}`} className="border-t border-border/40 text-muted">
                  <td className="py-2 font-mono text-xs text-text">{sub.user_id}</td>
                  <td className="py-2">{sub.status}</td>
                  <td className="py-2">{sub.plan_id ?? "-"}</td>
                  <td className="py-2">{sub.interval ?? "-"}</td>
                  <td className="py-2">{formatDate(sub.current_period_end)}</td>
                  <td className="py-2">{formatDate(sub.updated_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Provisioning Jobs</CardTitle>
          <CardDescription>Queue and provider outcomes.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="text-left text-xs uppercase tracking-[0.1em] text-muted">
              <tr>
                <th className="pb-2">Job ID</th>
                <th className="pb-2">User</th>
                <th className="pb-2">Status</th>
                <th className="pb-2">Retries</th>
                <th className="pb-2">Region</th>
                <th className="pb-2">Instance</th>
                <th className="pb-2">Updated</th>
                <th className="pb-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id} className="border-t border-border/40 text-muted">
                  <td className="py-2 font-mono text-xs text-text">{job.id}</td>
                  <td className="py-2 font-mono text-xs">{job.user_id}</td>
                  <td className="py-2">{job.status}</td>
                  <td className="py-2">
                    {job.retry_count}/{job.max_retries}
                  </td>
                  <td className="py-2">{job.region}</td>
                  <td className="py-2">{job.instance_id ?? "-"}</td>
                  <td className="py-2">{formatDate(job.updated_at)}</td>
                  <td className="py-2">
                    {job.status === "failed" ? <AdminRetryButton jobId={job.id} /> : <span className="text-xs">-</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}


