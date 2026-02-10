import type {
  AcademyAccessLevel,
  AcademyProgressStatus,
  AcademyRoomId,
  AcademyToolCategory,
  AcademyToolId
} from "@web3homeoffice/shared";

export type PlanId = "starter" | "pro" | "scale";
export type BillingInterval = "monthly" | "yearly";
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
export type GraphicsQuality = "low" | "medium" | "high";

export type { AcademyAccessLevel, AcademyProgressStatus, AcademyRoomId, AcademyToolCategory, AcademyToolId };


