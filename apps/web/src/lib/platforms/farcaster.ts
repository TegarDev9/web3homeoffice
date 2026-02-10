import { absoluteUrl } from "@/lib/utils";

export function getFarcasterManifest() {
  return {
    accountAssociation: {
      header: "",
      payload: "",
      signature: ""
    },
    miniapp: {
      version: "1",
      name: "Web3 Home Office",
      iconUrl: absoluteUrl("/icon.png"),
      homeUrl: absoluteUrl("/app"),
      subtitle: "Provision and manage your web3 home office infra.",
      description: "Neon cyberpunk hub to manage subscriptions and VPS provisioning.",
      screenshotUrls: [absoluteUrl("/screenshot-1.png")],
      primaryCategory: "developer-tools"
    }
  };
}


