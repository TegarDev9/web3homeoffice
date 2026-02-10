import { redirect } from "next/navigation";

import { DEFAULT_REGION } from "@web3homeoffice/shared";

import { PageHeader } from "@/components/layout/page-header";
import { ProvisionRequestForm } from "@/components/layout/provision-request-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ensureProfileForUser } from "@/lib/auth/admin-bootstrap";
import { requireActiveSubscription } from "@/lib/auth/guards";
import { requireUser } from "@/lib/auth/session";
import { listProvisionJobsForUser } from "@/lib/provisioning/jobs";
import { formatDate } from "@/lib/utils";

export default async function DashboardPage() {
  let user;

  try {
    user = await requireUser();
  } catch {
    redirect("/");
  }

  await ensureProfileForUser(user);
  const subscription = await requireActiveSubscription(user.id);
  const jobs = await listProvisionJobsForUser(user.id);
  const latestAutoInstallJob = jobs.find((job) => job.request_source === "subscription_auto");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Subscription status, provisioned instances, and job logs."
        statusLabel={subscription.status}
      />

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Current Plan</CardTitle>
            <CardDescription>Plan and billing interval synced from Creem webhooks.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted">
            <p>
              Plan: <span className="font-medium text-text">{subscription.plan_id ?? "unknown"}</span>
            </p>
            <p>
              Interval: <span className="font-medium text-text">{subscription.interval ?? "-"}</span>
            </p>
            <p>
              Current period end:{" "}
              <span className="font-medium text-text">{formatDate(subscription.current_period_end)}</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Access</CardTitle>
            <CardDescription>Feature gate is subscription-driven.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Badge variant="success">Active</Badge>
            <p className="text-muted">Provisioning APIs and 3D hub are enabled for active subscribers only.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Default Region</CardTitle>
            <CardDescription>Used when a provisioning request has no region override.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted">
            <p>
              Region: <span className="font-medium text-text">{DEFAULT_REGION}</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Auto Install</CardTitle>
            <CardDescription>Latest auto-install job from subscription activation.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted">
            <p>
              Status:{" "}
              <span className="font-medium text-text">{latestAutoInstallJob?.status ?? "not started"}</span>
            </p>
            <p>
              Package:{" "}
              <span className="font-medium text-text">{latestAutoInstallJob?.template ?? "-"}</span>
            </p>
            <p>
              OS: <span className="font-medium text-text">{latestAutoInstallJob?.os ?? "-"}</span>
            </p>
          </CardContent>
        </Card>
      </div>

      <ProvisionRequestForm defaultRegion={DEFAULT_REGION} />

      <Card>
        <CardHeader>
          <CardTitle>Provisioning Jobs</CardTitle>
          <CardDescription>Queue state from Supabase.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="text-left text-xs uppercase tracking-[0.1em] text-muted">
              <tr>
                <th className="pb-2">Job ID</th>
                <th className="pb-2">Source</th>
                <th className="pb-2">Status</th>
                <th className="pb-2">OS</th>
                <th className="pb-2">Region</th>
                <th className="pb-2">Instance</th>
                <th className="pb-2">IP</th>
                <th className="pb-2">Updated</th>
              </tr>
            </thead>
            <tbody className="text-muted">
              {jobs.map((job) => (
                <tr key={job.id} className="border-t border-border/40">
                  <td className="py-2 font-mono text-xs text-text">{job.id}</td>
                  <td className="py-2">{job.request_source}</td>
                  <td className="py-2">{job.status}</td>
                  <td className="py-2">{job.os}</td>
                  <td className="py-2">{job.region}</td>
                  <td className="py-2">{job.instance_id ?? "-"}</td>
                  <td className="py-2">{job.ip ?? "-"}</td>
                  <td className="py-2">{formatDate(job.updated_at)}</td>
                </tr>
              ))}
              {!jobs.length ? (
                <tr>
                  <td className="py-4 text-muted" colSpan={8}>
                    No jobs yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}


