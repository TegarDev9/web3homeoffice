import { describe, expect, it } from "vitest";

import { DEFAULT_PROVISION_OS, DEFAULT_PROVISION_TEMPLATE } from "@web3homeoffice/shared";

import { resolveCheckoutAutoInstallConfig } from "@/components/layout/billing-panel";

describe("billing panel auto-install config", () => {
  it("uses desktop-selected config on desktop viewport", () => {
    const config = resolveCheckoutAutoInstallConfig(true, {
      template: "rpc-placeholder",
      os: "debian"
    });

    expect(config).toEqual({
      template: "rpc-placeholder",
      os: "debian"
    });
  });

  it("falls back to default config on mobile viewport", () => {
    const config = resolveCheckoutAutoInstallConfig(false, {
      template: "rpc-placeholder",
      os: "kali"
    });

    expect(config).toEqual({
      template: DEFAULT_PROVISION_TEMPLATE,
      os: DEFAULT_PROVISION_OS
    });
  });
});

