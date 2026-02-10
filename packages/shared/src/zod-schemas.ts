import { z } from "zod";

import { ACADEMY_ROOM_IDS, ACADEMY_TOOL_CATEGORIES } from "./academy";
import { PLAN_IDS } from "./plans";
import {
  DEFAULT_PROVISION_OS,
  PROVISION_OS_IDS,
  PROVISION_TEMPLATE_IDS
} from "./provisioning";

export const planIdSchema = z.enum(PLAN_IDS);

export const billingIntervalSchema = z.enum(["monthly", "yearly"]);

export const checkoutPayloadSchema = z.object({
  planId: planIdSchema,
  interval: billingIntervalSchema,
  successPath: z.string().optional(),
  cancelPath: z.string().optional(),
  autoInstall: z
    .object({
      template: z.enum(PROVISION_TEMPLATE_IDS),
      os: z.enum(PROVISION_OS_IDS)
    })
    .optional()
});

export const provisionTemplateSchema = z.enum(PROVISION_TEMPLATE_IDS);
export const provisionOsSchema = z.enum(PROVISION_OS_IDS);

export const createProvisionJobSchema = z.object({
  planTemplate: provisionTemplateSchema,
  region: z.string().default("ap-singapore"),
  sshPublicKey: z.string().min(20).max(4096).optional(),
  os: provisionOsSchema.default(DEFAULT_PROVISION_OS)
});

export const cancellationRequestSchema = z.object({
  reason: z.string().trim().min(10).max(800)
});

export const academyProgressStatusSchema = z.enum(["not_started", "in_progress", "completed"]);

export const academyProgressUpsertSchema = z.object({
  roomId: z.enum(ACADEMY_ROOM_IDS),
  toolId: z.string().uuid(),
  status: academyProgressStatusSchema,
  score: z.number().min(0).max(100).optional()
});

export const academyToolLaunchSchema = z.object({
  roomId: z.enum(ACADEMY_ROOM_IDS).optional(),
  context: z.string().max(160).optional()
});

export const academyToolCategorySchema = z.enum(ACADEMY_TOOL_CATEGORIES);

