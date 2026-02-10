import {
  BellRing,
  Box,
  CloudCog,
  CreditCard,
  ShieldCheck,
  Smartphone,
  type LucideIcon
} from "lucide-react";

export type TrustMetric = {
  value: string;
  label: string;
  detail: string;
};

export type CapabilityItem = {
  title: string;
  description: string;
  icon: LucideIcon;
};

export type WorkflowStep = {
  title: string;
  description: string;
  bullets: string[];
};

export type PlanSnapshot = {
  id: "starter" | "pro" | "scale";
  name: string;
  instances: number;
  summary: string;
  highlight?: boolean;
};

export type FaqItem = {
  question: string;
  answer: string;
};

export const trustMetrics: TrustMetric[] = [
  {
    value: "3 Plans",
    label: "Starter / Pro / Scale",
    detail: "Flexible tiers mapped to real infrastructure limits."
  },
  {
    value: "RLS-first",
    label: "Tenant data isolation",
    detail: "Supabase policies enforce scoped access by user role."
  },
  {
    value: "Queue + Worker",
    label: "Server-side provisioning flow",
    detail: "VPS jobs are created in app and executed by Tencent worker."
  },
  {
    value: "Web + Mini Apps",
    label: "Multi-platform ready",
    detail: "Telegram, Farcaster, and Base contexts are supported."
  }
];

export const capabilities: CapabilityItem[] = [
  {
    title: "3D + 2D Operations",
    description: "Operate from immersive hub mode or switch to lightweight 2D instantly.",
    icon: Box
  },
  {
    title: "Creem Subscriptions",
    description: "Run monthly or yearly billing with webhook-synced access control.",
    icon: CreditCard
  },
  {
    title: "Supabase Auth + RLS",
    description: "Passwordless email OTP with policy-protected data boundaries.",
    icon: ShieldCheck
  },
  {
    title: "Tencent Provisioning Worker",
    description: "Provision jobs run off Vercel through a dedicated provider worker.",
    icon: CloudCog
  },
  {
    title: "Mini App Adapters",
    description: "Deliver the same product across web, Telegram, Farcaster, and Base.",
    icon: Smartphone
  },
  {
    title: "Admin + Retry Tooling",
    description: "Review users, subscriptions, jobs, and retry failed provisioning safely.",
    icon: BellRing
  }
];

export const workflowSteps: WorkflowStep[] = [
  {
    title: "Sign in with OTP",
    description: "Authenticate in seconds using email without managing passwords.",
    bullets: ["Supabase OTP flow", "Session-aware route guards", "Admin bootstrap by allowlist"]
  },
  {
    title: "Activate your plan",
    description: "Choose a plan interval and sync entitlement from Creem webhooks.",
    bullets: ["Starter / Pro / Scale", "Monthly and yearly checkout", "Portal fallback with cancel request"]
  },
  {
    title: "Provision and monitor",
    description: "Submit jobs, track logs, and let the worker handle retries automatically.",
    bullets: ["Queued provisioning jobs", "Retry backoff (1m / 5m / 15m)", "Admin manual retry for failures"]
  }
];

export const planSnapshot: PlanSnapshot[] = [
  {
    id: "starter",
    name: "Starter",
    instances: 1,
    summary: "Ideal for solo builders validating one critical workload."
  },
  {
    id: "pro",
    name: "Pro",
    instances: 3,
    summary: "Balanced setup for small teams managing multi-service infrastructure.",
    highlight: true
  },
  {
    id: "scale",
    name: "Scale",
    instances: 10,
    summary: "Built for operators running larger environments and parallel stacks."
  }
];

export const faqItems: FaqItem[] = [
  {
    question: "How is access granted or revoked?",
    answer:
      "Subscription status is synchronized by webhook events. Active and trialing plans unlock protected routes, while canceled or expired plans are gated back to billing."
  },
  {
    question: "Where are cloud provider secrets stored?",
    answer:
      "Cloud credentials stay server-side only. Tencent keys are scoped to the provisioner runtime and are never exposed in browser code."
  },
  {
    question: "What if the billing portal is unavailable?",
    answer:
      "Users can submit an in-app cancellation request that is stored and auditable, while support contact details remain visible in billing."
  },
  {
    question: "Can low-end devices still use the product?",
    answer:
      "Yes. The app supports graphics quality presets and a 2D fallback mode, so users can continue operating without heavy rendering."
  }
];
