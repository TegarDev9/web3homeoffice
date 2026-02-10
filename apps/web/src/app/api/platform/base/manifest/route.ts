import { ok } from "@/lib/api/responses";
import { absoluteUrl } from "@/lib/utils";

export function GET() {
  return ok({
    name: "Web3 Home Office",
    description: "Manage subscriptions and provision Tencent Cloud VPS in one mini app-ready hub.",
    iconUrl: absoluteUrl("/icon.png"),
    url: absoluteUrl("/app"),
    supportedChains: ["base"]
  });
}


