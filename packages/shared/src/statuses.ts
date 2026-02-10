export type SubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "expired";

export type ProvisionJobStatus =
  | "pending"
  | "running"
  | "provisioned"
  | "failed"
  | "revoked";

export const ACTIVE_SUBSCRIPTION_STATUSES: SubscriptionStatus[] = ["trialing", "active"];

export const TERMINAL_SUBSCRIPTION_STATUSES: SubscriptionStatus[] = ["canceled", "expired"];

export const OPEN_PROVISION_JOB_STATUSES: ProvisionJobStatus[] = ["pending", "running"];

