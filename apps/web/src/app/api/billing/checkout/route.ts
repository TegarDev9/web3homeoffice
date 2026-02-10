import { NextRequest } from "next/server";

import { checkoutPayloadSchema } from "@web3homeoffice/shared";

import { requireUser } from "@/lib/auth/session";
import { createCreemCheckoutSession } from "@/lib/billing/creem-client";
import { getPlanById, planPriceId } from "@/lib/billing/subscription-service";
import { fail, ok } from "@/lib/api/responses";
import { absoluteUrl } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const payload = checkoutPayloadSchema.parse(await request.json());
    const plan = await getPlanById(payload.planId);
    const priceId = planPriceId(plan, payload.interval);

    if (!user.email) {
      throw new Error("Authenticated user must have an email");
    }

    const successUrl = absoluteUrl(payload.successPath ?? "/billing/success");
    const cancelUrl = absoluteUrl(payload.cancelPath ?? "/billing");

    const checkout = await createCreemCheckoutSession({
      priceId,
      customerEmail: user.email,
      successUrl,
      cancelUrl,
      metadata: {
        user_id: user.id,
        plan_id: payload.planId,
        interval: payload.interval
      }
    });

    return ok({ checkoutUrl: checkout.url });
  } catch (error) {
    return fail(error);
  }
}


