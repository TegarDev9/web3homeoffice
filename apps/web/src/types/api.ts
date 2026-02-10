import type {
  AcademyAccessLevel,
  AcademyProgressStatus,
  AcademyRoomId,
  BillingInterval,
  PlanId,
  ProvisionJobStatus
} from "@web3homeoffice/shared";

export type CheckoutRequest = {
  planId: PlanId;
  interval: BillingInterval;
  successPath?: string;
  cancelPath?: string;
};

export type CheckoutResponse = {
  checkoutUrl: string;
};

export type BillingPortalResponse = {
  url: string | null;
  fallback: "support" | null;
  canRequestCancellation: boolean;
};

export type CancellationRequestPayload = {
  reason: string;
};

export type CreateProvisionJobRequest = {
  planTemplate: "vps-base" | "rpc-placeholder";
  region?: string;
  sshPublicKey?: string;
};

export type CreateProvisionJobResponse = {
  jobId: string;
  status: ProvisionJobStatus;
};

export type TelegramVerifyRequest = {
  initData: string;
};

export type AcademyRoomSummaryResponse = {
  accessLevel: AcademyAccessLevel;
  language: "id" | "en";
  rooms: Array<{
    id: AcademyRoomId;
    slug: string;
    marker: string;
    title: string;
    subtitle: string;
    summary: string;
    summarySecondary: string;
    theme: Record<string, unknown>;
    position: [number, number, number];
    sortOrder: number;
    isPublicPreview: boolean;
    toolCount: number;
  }>;
};

export type AcademyProgressPayload = {
  roomId: AcademyRoomId;
  toolId: string;
  status: AcademyProgressStatus;
  score?: number;
};


