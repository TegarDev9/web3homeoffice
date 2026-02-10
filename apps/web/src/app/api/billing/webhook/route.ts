import { NextRequest } from "next/server";

import { fail, ok } from "@/lib/api/responses";
import { getServerEnv } from "@/lib/env";
import { assertCreemWebhookSignature } from "@/lib/billing/creem-signature";
import {
  normalizeCreemEvent,
  recordWebhookEvent,
  syncSubscriptionFromEvent
} from "@/lib/billing/subscription-service";

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const env = getServerEnv();
    const signature = request.headers.get(env.CREEM_WEBHOOK_SIGNATURE_HEADER);

    assertCreemWebhookSignature(rawBody, signature);

    const payload = JSON.parse(rawBody) as unknown;
    const event = normalizeCreemEvent(payload);

    const shouldProcess = await recordWebhookEvent(event);
    if (!shouldProcess) {
      return ok({ received: true, duplicate: true });
    }

    await syncSubscriptionFromEvent(event);

    return ok({ received: true });
  } catch (error) {
    return fail(error);
  }
}


