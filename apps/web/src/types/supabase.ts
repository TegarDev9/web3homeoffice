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

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          user_id: string;
          handle: string | null;
          role: "user" | "admin";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          handle?: string | null;
          role?: "user" | "admin";
        };
        Update: {
          handle?: string | null;
          role?: "user" | "admin";
          updated_at?: string;
        };
        Relationships: [];
      };
      plans: {
        Row: {
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
        Insert: {
          plan_id: PlanId;
          name: string;
          creem_product_id: string;
          monthly_price_id: string;
          yearly_price_id: string;
          limits: Json;
          active?: boolean;
        };
        Update: {
          name?: string;
          creem_product_id?: string;
          monthly_price_id?: string;
          yearly_price_id?: string;
          limits?: Json;
          active?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      subscriptions: {
        Row: {
          user_id: string;
          creem_customer_id: string | null;
          creem_subscription_id: string | null;
          status: SubscriptionStatus;
          current_period_end: string | null;
          plan_id: PlanId | null;
          interval: BillingInterval | null;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          creem_customer_id?: string | null;
          creem_subscription_id?: string | null;
          status?: SubscriptionStatus;
          current_period_end?: string | null;
          plan_id?: PlanId | null;
          interval?: BillingInterval | null;
        };
        Update: {
          creem_customer_id?: string | null;
          creem_subscription_id?: string | null;
          status?: SubscriptionStatus;
          current_period_end?: string | null;
          plan_id?: PlanId | null;
          interval?: BillingInterval | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      provision_jobs: {
        Row: {
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
        Insert: {
          id?: string;
          user_id: string;
          plan_id: PlanId;
          template: "vps-base" | "rpc-placeholder";
          status?: ProvisionJobStatus;
          region: string;
          instance_id?: string | null;
          ip?: string | null;
          retry_count?: number;
          max_retries?: number;
          next_retry_at?: string;
          last_error?: string | null;
          ssh_public_key?: string | null;
          logs?: Json;
        };
        Update: {
          status?: ProvisionJobStatus;
          instance_id?: string | null;
          ip?: string | null;
          retry_count?: number;
          max_retries?: number;
          next_retry_at?: string;
          last_error?: string | null;
          ssh_public_key?: string | null;
          logs?: Json;
          updated_at?: string;
        };
        Relationships: [];
      };
      academy_rooms: {
        Row: {
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
        Insert: {
          id: AcademyRoomId;
          slug: string;
          title_id: string;
          title_en: string;
          summary_id: string;
          summary_en: string;
          theme?: Json;
          position: Json;
          marker: string;
          sort_order?: number;
          is_public_preview?: boolean;
        };
        Update: {
          slug?: string;
          title_id?: string;
          title_en?: string;
          summary_id?: string;
          summary_en?: string;
          theme?: Json;
          position?: Json;
          marker?: string;
          sort_order?: number;
          is_public_preview?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      academy_tools: {
        Row: {
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
        Insert: {
          id?: string;
          room_id: AcademyRoomId;
          tool_key: string;
          name_id: string;
          name_en: string;
          description_id: string;
          description_en: string;
          category: AcademyToolCategory;
          difficulty?: string;
          is_member_only?: boolean;
          action_kind: "link" | "internal" | "demo";
          action_payload?: Json;
          sort_order?: number;
        };
        Update: {
          room_id?: AcademyRoomId;
          tool_key?: string;
          name_id?: string;
          name_en?: string;
          description_id?: string;
          description_en?: string;
          category?: AcademyToolCategory;
          difficulty?: string;
          is_member_only?: boolean;
          action_kind?: "link" | "internal" | "demo";
          action_payload?: Json;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      academy_pc_stations: {
        Row: {
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
        Insert: {
          id?: string;
          room_id: AcademyRoomId;
          label: string;
          model_key: string;
          position: Json;
          rotation: Json;
          specs?: Json;
        };
        Update: {
          room_id?: AcademyRoomId;
          label?: string;
          model_key?: string;
          position?: Json;
          rotation?: Json;
          specs?: Json;
          updated_at?: string;
        };
        Relationships: [];
      };
      academy_user_progress: {
        Row: {
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
        Insert: {
          id?: string;
          user_id: string;
          room_id: AcademyRoomId;
          tool_id: string;
          status: AcademyProgressStatus;
          score?: number | null;
          last_seen_at?: string;
          completed_at?: string | null;
        };
        Update: {
          status?: AcademyProgressStatus;
          score?: number | null;
          last_seen_at?: string;
          completed_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      academy_activity_logs: {
        Row: {
          id: string;
          user_id: string | null;
          room_id: AcademyRoomId;
          tool_id: string | null;
          event_type: string;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          room_id: AcademyRoomId;
          tool_id?: string | null;
          event_type: string;
          metadata?: Json;
        };
        Update: {
          event_type?: string;
          metadata?: Json;
        };
        Relationships: [];
      };
      cancellation_requests: {
        Row: {
          id: string;
          user_id: string;
          subscription_id: string | null;
          reason: string;
          status: "open" | "in_review" | "closed";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          subscription_id?: string | null;
          reason: string;
          status?: "open" | "in_review" | "closed";
        };
        Update: {
          reason?: string;
          status?: "open" | "in_review" | "closed";
          updated_at?: string;
        };
        Relationships: [];
      };
      platform_accounts: {
        Row: {
          id: string;
          user_id: string;
          platform: "telegram" | "farcaster" | "base";
          platform_user_id: string;
          username: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          platform: "telegram" | "farcaster" | "base";
          platform_user_id: string;
          username?: string | null;
          metadata?: Json;
        };
        Update: {
          username?: string | null;
          metadata?: Json;
        };
        Relationships: [];
      };
      webhook_events: {
        Row: {
          id: string;
          provider: string;
          type: string;
          payload: Json;
          received_at: string;
        };
        Insert: {
          id: string;
          provider: string;
          type: string;
          payload: Json;
        };
        Update: {
          type?: string;
          payload?: Json;
        };
        Relationships: [];
      };
    };
    Views: {
      academy_rooms_with_tools: {
        Row: {
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
          tools: Json;
        };
        Relationships: [];
      };
    };
    Functions: {
      has_active_subscription: {
        Args: { user_uuid: string };
        Returns: boolean;
      };
      dequeue_provision_jobs: {
        Args: { batch_size?: number };
        Returns: Database["public"]["Tables"]["provision_jobs"]["Row"][];
      };
      append_provision_job_log: {
        Args: { job_id: string; log_line: Json };
        Returns: undefined;
      };
    };
    Enums: {
      subscription_status: SubscriptionStatus;
      billing_interval: BillingInterval;
      provision_job_status: ProvisionJobStatus;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};


