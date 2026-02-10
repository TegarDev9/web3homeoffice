import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Compass,
  LockKeyhole,
  PlayCircle,
  Server,
  ShieldCheck
} from "lucide-react";

import { AuthCard } from "@/components/layout/auth-card";
import { CapabilityGrid } from "@/components/marketing/capability-grid";
import { Faq } from "@/components/marketing/faq";
import {
  capabilities,
  faqItems,
  planSnapshot,
  trustMetrics,
  workflowSteps
} from "@/components/marketing/landing-data";
import { MetricStrip } from "@/components/marketing/metric-strip";
import { PlanPreview } from "@/components/marketing/plan-preview";
import { SectionHeading } from "@/components/marketing/section-heading";
import { WorkflowSteps } from "@/components/marketing/workflow-steps";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LandingPage() {
  return (
    <div id="top" className="marketing-grid-bg space-y-14 pb-14 pt-4 md:space-y-20">
      <section className="marketing-section relative overflow-hidden rounded-xl border border-border/60 bg-black/20 p-6 lg:p-8">
        <div className="marketing-spotlight pointer-events-none absolute inset-0" />
        <div className="pointer-events-none absolute inset-x-10 top-0 h-40 bg-[radial-gradient(circle_at_50%_0%,rgba(32,212,255,0.2),transparent_70%)]" />
        <div className="relative grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:gap-10">
          <div className="space-y-7 marketing-reveal marketing-reveal-1">
            <Badge variant="secondary" className="border-accent/35 bg-accent/10 text-accent">
              Built for web3 operator teams
            </Badge>

            <div className="space-y-5">
              <h1 className="max-w-3xl text-4xl font-semibold leading-tight text-text sm:text-5xl">
                Launch and operate web3 infrastructure from one command center.
              </h1>
              <p className="max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
                Web3 Home Office combines onboarding, billing, access control, and provisioning into one
                production-oriented workflow running on Cloudflare and Tencent.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="#auth">
                  Start free with email
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="secondary" size="lg" asChild>
                <Link href="/billing">View plans and pricing</Link>
              </Button>
            </div>
            <p className="text-sm text-muted">
              Go from OTP login to provision-ready workflows without building internal platform tooling.
            </p>

            <Link
              href="/academy"
              className="inline-flex w-fit items-center text-sm font-medium text-accent underline-offset-4 transition hover:text-accent-2 hover:underline"
            >
              <PlayCircle className="mr-2 h-4 w-4" />
              Explore academy preview
            </Link>

            <div className="grid gap-3 text-sm text-muted sm:grid-cols-3">
              <p className="marketing-chip">Passwordless OTP onboarding</p>
              <p className="marketing-chip">Webhook-synced access control</p>
              <p className="marketing-chip">Queue-backed provisioning execution</p>
            </div>
          </div>

          <div className="space-y-4 marketing-reveal marketing-reveal-2">
            <AuthCard id="auth" variant="marketing" hideSignOut />
            <Card className="glass border-border/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl">Operator runbook at a glance</CardTitle>
                <CardDescription>Built for fast action while keeping critical controls server-side.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-md border border-border/60 bg-black/20 p-3">
                  <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-text">
                    <Compass className="h-4 w-4 text-accent" />
                    Step 1
                  </p>
                  <p className="text-xs text-muted">Authenticate with OTP and establish your operator session.</p>
                </div>
                <div className="rounded-md border border-border/60 bg-black/20 p-3">
                  <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-text">
                    <CheckCircle2 className="h-4 w-4 text-accent" />
                    Step 2
                  </p>
                  <p className="text-xs text-muted">Activate billing plan and enforce entitlement automatically.</p>
                </div>
                <div className="rounded-md border border-border/60 bg-black/20 p-3">
                  <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-text">
                    <Server className="h-4 w-4 text-accent" />
                    Step 3
                  </p>
                  <p className="text-xs text-muted">Queue provisioning jobs and track logs from a single workspace.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section id="proof" className="marketing-section space-y-5 marketing-reveal marketing-reveal-3">
        <SectionHeading
          eyebrow="Operational proof"
          title="Run production workflows with visible guardrails."
          description="Every critical flow is explicit: identity, entitlement, provisioning, retry, and auditability."
          align="center"
        />
        <MetricStrip metrics={trustMetrics} />
      </section>

      <section id="product" className="marketing-section space-y-5 marketing-reveal marketing-reveal-4">
        <SectionHeading
          eyebrow="Capabilities"
          title="Everything needed to operate without glue-code chaos."
          description="Built for teams that need speed, uptime discipline, and clean operational ownership."
        />
        <CapabilityGrid items={capabilities} />
      </section>

      <section id="how" className="marketing-section space-y-5 marketing-reveal marketing-reveal-5">
        <SectionHeading
          eyebrow="How it works"
          title="Move from sign-in to running workloads in three steps."
          description="Fast onboarding with server-controlled execution and recovery-friendly operations."
        />
        <WorkflowSteps steps={workflowSteps} />
      </section>

      <section id="plans" className="marketing-section space-y-5 marketing-reveal marketing-reveal-6">
        <SectionHeading
          eyebrow="Plan snapshot"
          title="Choose capacity for your operating footprint."
          description="Switch plans and intervals from billing without changing your provisioning workflow."
        />
        <PlanPreview plans={planSnapshot} />
        <p className="text-center text-sm text-muted">
          All plans include OTP auth, webhook-driven access checks, and queue-based provisioning flows.
        </p>
      </section>

      <section id="security" className="marketing-section marketing-reveal marketing-reveal-7">
        <Card className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(32,212,255,0.15),transparent_45%)]" />
          <CardHeader className="relative">
            <CardTitle className="text-2xl">Security and control posture</CardTitle>
            <CardDescription>
              Sensitive credentials remain outside the browser while server-side checks keep workflows enforceable.
            </CardDescription>
          </CardHeader>
          <CardContent className="relative grid gap-3 md:grid-cols-3">
            <div className="rounded-md border border-border/60 bg-black/20 p-3">
              <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-text">
                <LockKeyhole className="h-4 w-4 text-accent" />
                Secret isolation
              </p>
              <p className="text-sm text-muted">Cloud and billing keys are read only in server runtimes.</p>
            </div>
            <div className="rounded-md border border-border/60 bg-black/20 p-3">
              <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-text">
                <ShieldCheck className="h-4 w-4 text-accent" />
                Access policy gates
              </p>
              <p className="text-sm text-muted">Subscription and admin checks are enforced on protected routes.</p>
            </div>
            <div className="rounded-md border border-border/60 bg-black/20 p-3">
              <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-text">
                <Server className="h-4 w-4 text-accent" />
                Operational audit trail
              </p>
              <p className="text-sm text-muted">Webhook events and job logs are persisted for traceability.</p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section id="faq" className="marketing-section space-y-5 marketing-reveal marketing-reveal-8">
        <SectionHeading
          eyebrow="FAQ"
          title="Answers to high-impact operations questions."
          description="Focused on entitlement control, cloud credential safety, and failure handling."
        />
        <Faq items={faqItems} />
      </section>

      <section id="cta" className="marketing-section marketing-reveal marketing-reveal-9">
        <Card className="relative overflow-hidden border-accent/35">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_40%,rgba(32,212,255,0.2),transparent_48%),radial-gradient(circle_at_80%_50%,rgba(255,57,184,0.2),transparent_40%)]" />
          <CardHeader className="relative">
            <CardTitle className="text-3xl">Ready to run your web3 operations stack?</CardTitle>
            <CardDescription className="max-w-2xl text-base">
              Start with secure email login, select a plan that matches your footprint, and operate from a single,
              recovery-friendly command center.
            </CardDescription>
          </CardHeader>
          <CardContent className="relative flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="#auth">
                Start free with email
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="secondary" size="lg" asChild>
              <Link href="/billing">Compare plans</Link>
            </Button>
            <p className="flex items-center text-sm text-muted">
              <CheckCircle2 className="mr-2 h-4 w-4 text-accent" />
              Designed for teams that need shipping speed without losing operational control.
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}


