import { z } from "zod";

import { academyToolLaunchSchema } from "@web3homeoffice/shared";

import { AppError } from "@/lib/api/errors";
import { fail, ok } from "@/lib/api/responses";
import { getAcademyAccessContext } from "@/lib/academy/access";
import { getAcademyToolById } from "@/lib/academy/catalog";
import { createAcademyActivityLog } from "@/lib/academy/logs";
import { isAcademyEvmEnabled } from "@/lib/env";

const paramsSchema = z.object({
  toolId: z.string().uuid()
});

export async function POST(
  request: Request,
  context: {
    params: Promise<{ toolId: string }>;
  }
) {
  try {
    const { toolId } = paramsSchema.parse(await context.params);
    const payload = academyToolLaunchSchema.safeParse(await request.json().catch(() => ({})));
    const access = await getAcademyAccessContext();
    const tool = await getAcademyToolById(toolId);

    if (!tool) {
      throw new AppError("Academy tool not found", 404, "ACADEMY_TOOL_NOT_FOUND");
    }

    if (tool.is_member_only && access.accessLevel !== "member") {
      await createAcademyActivityLog({
        userId: access.userId,
        roomId: tool.room_id,
        toolId: tool.id,
        eventType: "tool_launch_blocked_member_only",
        metadata: {
          accessLevel: access.accessLevel,
          context: payload.success ? payload.data.context ?? null : null
        }
      });

      throw new AppError("This tool requires an active subscription", 402, "SUBSCRIPTION_REQUIRED");
    }

    await createAcademyActivityLog({
      userId: access.userId,
      roomId: tool.room_id,
      toolId: tool.id,
      eventType: "tool_launch_allowed",
      metadata: {
        accessLevel: access.accessLevel,
        context: payload.success ? payload.data.context ?? null : null
      }
    });

    return ok({
      allowed: true,
      accessLevel: access.accessLevel,
      tool: {
        id: tool.id,
        roomId: tool.room_id,
        toolKey: tool.tool_key,
        actionKind: tool.action_kind,
        actionPayload: tool.action_payload
      },
      evmEnabled: isAcademyEvmEnabled()
    });
  } catch (error) {
    return fail(error);
  }
}
