import type {
  AcademyProgressStatus,
  AcademyRoomId,
  AcademyToolCategory,
  BillingInterval,
  PlanId,
  ProvisionJobStatus,
  SubscriptionStatus
} from "@web3homeoffice/shared";

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export type ProfileRow = {
  user_id: string;
  handle: string | null;
  role: "user" | "admin";
  created_at: string;
  updated_at: string;
};

export type PlanRow = {
  plan_id: PlanId;
  name: string;
  creem_product_id: string;
  monthly_price_id: string;
  yearly_price_id: string;
  limits: Json;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type SubscriptionRow = {
  user_id: string;
  creem_customer_id: string | null;
  creem_subscription_id: string | null;
  status: SubscriptionStatus;
  current_period_end: string | null;
  plan_id: PlanId | null;
  interval: BillingInterval | null;
  updated_at: string;
};

export type ProvisionJobRow = {
  id: string;
  user_id: string;
  plan_id: PlanId;
  template: "vps-base" | "rpc-placeholder";
  status: ProvisionJobStatus;
  region: string;
  instance_id: string | null;
  ip: string | null;
  retry_count: number;
  max_retries: number;
  next_retry_at: string;
  last_error: string | null;
  ssh_public_key: string | null;
  logs: Json;
  created_at: string;
  updated_at: string;
};

export type AcademyRoomRow = {
  id: AcademyRoomId;
  slug: string;
  title_id: string;
  title_en: string;
  summary_id: string;
  summary_en: string;
  theme: Json;
  position: Json;
  marker: string;
  sort_order: number;
  is_public_preview: boolean;
  created_at: string;
  updated_at: string;
};

export type AcademyToolRow = {
  id: string;
  room_id: AcademyRoomId;
  tool_key: string;
  name_id: string;
  name_en: string;
  description_id: string;
  description_en: string;
  category: AcademyToolCategory;
  difficulty: string;
  is_member_only: boolean;
  action_kind: "link" | "internal" | "demo";
  action_payload: Json;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type AcademyPcStationRow = {
  id: string;
  room_id: AcademyRoomId;
  label: string;
  model_key: string;
  position: Json;
  rotation: Json;
  specs: Json;
  created_at: string;
  updated_at: string;
};

export type AcademyUserProgressRow = {
  id: string;
  user_id: string;
  room_id: AcademyRoomId;
  tool_id: string;
  status: AcademyProgressStatus;
  score: number | null;
  last_seen_at: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type AcademyActivityLogRow = {
  id: string;
  user_id: string | null;
  room_id: AcademyRoomId;
  tool_id: string | null;
  event_type: string;
  metadata: Json;
  created_at: string;
};

export type CancellationRequestRow = {
  id: string;
  user_id: string;
  subscription_id: string | null;
  reason: string;
  status: "open" | "in_review" | "closed";
  created_at: string;
  updated_at: string;
};

export type PlatformAccountRow = {
  id: string;
  user_id: string;
  platform: "telegram" | "farcaster" | "base";
  platform_user_id: string;
  username: string | null;
  metadata: Json;
  created_at: string;
};

export type WebhookEventRow = {
  id: string;
  provider: string;
  type: string;
  payload: Json;
  received_at: string;
};


