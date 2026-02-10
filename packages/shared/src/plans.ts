export type PlanId = "starter" | "pro" | "scale";
export type BillingInterval = "monthly" | "yearly";

export type PlanDefinition = {
  id: PlanId;
  name: string;
  description: string;
  limits: {
    instances: number;
    regions: string[];
  };
};

export const PLAN_IDS = ["starter", "pro", "scale"] as const;

export const DEFAULT_REGION = "ap-singapore";

export const PLAN_DEFINITIONS: PlanDefinition[] = [
  {
    id: "starter",
    name: "Starter",
    description: "Solo builder tier with one managed node.",
    limits: {
      instances: 1,
      regions: [DEFAULT_REGION]
    }
  },
  {
    id: "pro",
    name: "Pro",
    description: "For growing teams with multi-instance workloads.",
    limits: {
      instances: 3,
      regions: [DEFAULT_REGION, "ap-jakarta"]
    }
  },
  {
    id: "scale",
    name: "Scale",
    description: "Production scale with expanded regional footprint.",
    limits: {
      instances: 10,
      regions: [DEFAULT_REGION, "ap-jakarta", "ap-hongkong"]
    }
  }
];

