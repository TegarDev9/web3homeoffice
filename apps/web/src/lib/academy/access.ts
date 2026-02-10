import { isSubscriptionActive, getUserSubscription } from "@/lib/auth/guards";
import { getCurrentUser } from "@/lib/auth/session";
import type { AcademyAccessContext } from "@/lib/academy/types";

export async function getAcademyAccessContext(): Promise<AcademyAccessContext> {
  const user = await getCurrentUser();

  if (!user) {
    return {
      accessLevel: "preview",
      userId: null,
      hasActiveSubscription: false
    };
  }

  const subscription = await getUserSubscription(user.id);
  const hasActiveSubscription = isSubscriptionActive(subscription?.status);

  return {
    accessLevel: hasActiveSubscription ? "member" : "preview",
    userId: user.id,
    hasActiveSubscription
  };
}
