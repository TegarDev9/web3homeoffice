import { fail, ok } from "@/lib/api/responses";
import { requireUser } from "@/lib/auth/session";
import { getCreemPortalUrl } from "@/lib/billing/creem-client";
import { getUserSubscription } from "@/lib/auth/guards";

export async function POST() {
  try {
    const user = await requireUser();
    const subscription = await getUserSubscription(user.id);

    if (!subscription?.creem_customer_id) {
      return ok({ url: null, fallback: "support" as const, canRequestCancellation: true });
    }

    const url = await getCreemPortalUrl(subscription.creem_customer_id);
    if (!url) {
      return ok({ url: null, fallback: "support" as const, canRequestCancellation: true });
    }

    return ok({ url, fallback: null, canRequestCancellation: false });
  } catch (error) {
    return fail(error);
  }
}


