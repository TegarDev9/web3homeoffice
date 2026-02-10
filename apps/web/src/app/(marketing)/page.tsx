import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
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
    <div id="top" className="marketing-grid-bg space-y-14 pb-12 pt-4 md:space-y-16">
      <section className="marketing-section relative overflow-hidden rounded-xl border border-border/60 bg-black/20 p-6 lg:p-8">
        <div className="marketing-spotlight pointer-events-none absolute inset-0" />
        <div className="relative grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:gap-10">
          <div className="space-y-6">
            <Badge variant="secondary" className="border-accent/35 bg-accent/10 text-accent">
              Global-ready web3 operations stack
            </Badge>

            <div className="space-y-4">
              <h1 className="max-w-3xl text-4xl font-semibold leading-tight text-text sm:text-5xl">
                Operate blockchain infrastructure from one control plane.
              </h1>
              <p className="max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
                Web3 Home Office unifies onboarding, subscription billing, provisioning, and monitoring into a clean
                SaaS workflow designed for modern teams.
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
                <Link href="/billing">View plans</Link>
              </Button>
            </div>
            <Link
              href="/app"
              className="inline-flex w-fit items-center text-sm font-medium text-accent underline-offset-4 transition hover:text-accent-2 hover:underline"
            >
              <PlayCircle className="mr-2 h-4 w-4" />
              Preview 3D Hub
            </Link>

            <div className="grid gap-3 text-sm text-muted sm:grid-cols-3">
              <p className="rounded-md border border-border/50 bg-black/20 px-3 py-2">No password setup required.</p>
              <p className="rounded-md border border-border/50 bg-black/20 px-3 py-2">Plans sync via webhooks.</p>
              <p className="rounded-md border border-border/50 bg-black/20 px-3 py-2">Provisioning runs server-side.</p>
            </div>
          </div>

          <AuthCard id="auth" variant="marketing" hideSignOut />
        </div>
      </section>

      <section id="trust" className="marketing-section space-y-5">
        <SectionHeading
          eyebrow="Trust by design"
          title="Built with practical guardrails, not hype."
          description="Every key flow is explicit: identity, entitlement, provisioning, and audit visibility."
          align="center"
        />
        <MetricStrip metrics={trustMetrics} />
      </section>

      <section id="product" className="marketing-section space-y-5">
        <SectionHeading
          eyebrow="Capabilities"
          title="Everything needed to run your web3 home office."
          description="A production-minded stack for teams that need speed, visibility, and control."
        />
        <CapabilityGrid items={capabilities} />
      </section>

      <section id="how" className="marketing-section space-y-5">
        <SectionHeading
          eyebrow="How it works"
          title="Move from sign-in to live infrastructure in three steps."
          description="Designed for fast onboarding while keeping critical operations server-controlled."
        />
        <WorkflowSteps steps={workflowSteps} />
      </section>

      <section id="plans" className="marketing-section space-y-5">
        <SectionHeading
          eyebrow="Plan snapshot"
          title="Choose a plan that matches your operating footprint."
          description="Upgrade or change interval from billing without changing your operational workflow."
        />
        <PlanPreview plans={planSnapshot} />
      </section>

      <section id="security" className="marketing-section">
        <Card className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(32,212,255,0.15),transparent_45%)]" />
          <CardHeader className="relative">
            <CardTitle className="text-2xl">Security and compliance posture</CardTitle>
            <CardDescription>
              Sensitive credentials remain outside the browser, while role checks and logs keep operations auditable.
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
              <p className="text-sm text-muted">Subscription and admin checks are enforced on server routes.</p>
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

      <section id="faq" className="marketing-section space-y-5">
        <SectionHeading
          eyebrow="FAQ"
          title="Answers to common operations questions."
          description="Focused on access control, billing edge cases, and provisioning safety."
        />
        <Faq items={faqItems} />
      </section>

      <section id="cta" className="marketing-section">
        <Card className="relative overflow-hidden border-accent/35">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_40%,rgba(32,212,255,0.2),transparent_48%),radial-gradient(circle_at_80%_50%,rgba(255,57,184,0.2),transparent_40%)]" />
          <CardHeader className="relative">
            <CardTitle className="text-3xl">Launch your web3 office today.</CardTitle>
            <CardDescription className="max-w-2xl text-base">
              Start with secure email login, pick the plan that fits your team, and provision infrastructure through a
              worker architecture built for production constraints.
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
              <Link href="/dashboard">Open dashboard</Link>
            </Button>
            <p className="flex items-center text-sm text-muted">
              <CheckCircle2 className="mr-2 h-4 w-4 text-accent" />
              Designed for teams that need speed without giving up operational control.
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}


