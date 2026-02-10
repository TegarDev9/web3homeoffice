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
    value: "<60s",
    label: "OTP onboarding",
    detail: "Users can authenticate quickly with passwordless email login."
  },
  {
    value: "Webhook-synced",
    label: "Entitlement control",
    detail: "Creem events are synchronized to enforce subscription-based route access."
  },
  {
    value: "Queue-backed",
    label: "Provision execution",
    detail: "Jobs are queued from the Cloudflare-hosted app and executed by Tencent worker."
  },
  {
    value: "Audit-ready",
    label: "Operational visibility",
    detail: "Admins can inspect retries, logs, and status transitions in one place."
  }
];

export const capabilities: CapabilityItem[] = [
  {
    title: "Operator Workspace",
    description: "Switch between immersive 3D hub and practical 2D dashboards based on team needs.",
    icon: Box
  },
  {
    title: "Billing-Driven Access",
    description: "Use Creem monthly/yearly plans with webhook-synced entitlement checks.",
    icon: CreditCard
  },
  {
    title: "Supabase Auth + RLS",
    description: "Passwordless OTP and policy-enforced tenant isolation from day one.",
    icon: ShieldCheck
  },
  {
    title: "Cloudflare + Tencent Architecture",
    description: "Cloudflare handles app runtime while Tencent worker executes long-running provisioning jobs.",
    icon: CloudCog
  },
  {
    title: "Mini App Adapters",
    description: "Ship one product surface across web, Telegram, Farcaster, and Base contexts.",
    icon: Smartphone
  },
  {
    title: "Admin Recovery Tools",
    description: "Inspect users, subscriptions, and failed jobs with safe retry controls.",
    icon: BellRing
  }
];

export const workflowSteps: WorkflowStep[] = [
  {
    title: "Authenticate in seconds",
    description: "Start with passwordless email OTP and land in a guarded session.",
    bullets: ["Supabase magic-link flow", "Session-aware route protection", "Admin bootstrap by allowlist"]
  },
  {
    title: "Activate a plan",
    description: "Pick monthly or yearly billing and sync entitlement from webhook events.",
    bullets: ["Starter / Pro / Scale tiers", "Checkout + portal fallback", "Cancellation request safety path"]
  },
  {
    title: "Provision with control",
    description: "Queue infrastructure jobs, track outcomes, and recover failed operations quickly.",
    bullets: ["Queued provisioning requests", "Automatic retry backoff", "Manual retry for failed jobs"]
  }
];

export const planSnapshot: PlanSnapshot[] = [
  {
    id: "starter",
    name: "Starter",
    instances: 1,
    summary: "For solo operators launching one production-critical workload."
  },
  {
    id: "pro",
    name: "Pro",
    instances: 3,
    summary: "For small teams managing multi-service deployments with room to grow.",
    highlight: true
  },
  {
    id: "scale",
    name: "Scale",
    instances: 10,
    summary: "For high-throughput operators running parallel stacks across regions."
  }
];

export const faqItems: FaqItem[] = [
  {
    question: "How is access granted or revoked?",
    answer:
      "Subscription status is synchronized by webhook events. Active plans unlock protected routes, while canceled or expired plans are gated to billing."
  },
  {
    question: "Where are cloud and billing secrets stored?",
    answer:
      "Secrets remain server-side only. Cloudflare runs the web app runtime, while Tencent credentials stay scoped to the provisioner worker."
  },
  {
    question: "What if the billing portal is unavailable?",
    answer:
      "Users can submit an auditable cancellation request in-app, and support contact details stay visible as fallback."
  },
  {
    question: "Can lower-end devices still use the product?",
    answer:
      "Yes. Users can choose lighter graphics settings and use 2D fallback workflows when needed."
  }
];
