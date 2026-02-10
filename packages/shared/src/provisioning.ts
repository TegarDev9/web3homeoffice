export const PROVISION_TEMPLATE_IDS = ["vps-base", "rpc-placeholder"] as const;
export type ProvisionTemplate = (typeof PROVISION_TEMPLATE_IDS)[number];
export const DEFAULT_PROVISION_TEMPLATE: ProvisionTemplate = "vps-base";

export const PROVISION_OS_IDS = ["debian", "ubuntu", "kali"] as const;
export type ProvisionOs = (typeof PROVISION_OS_IDS)[number];
export const DEFAULT_PROVISION_OS: ProvisionOs = "ubuntu";

export const PROVISION_REQUEST_SOURCES = ["manual", "subscription_auto"] as const;
export type ProvisionRequestSource = (typeof PROVISION_REQUEST_SOURCES)[number];
