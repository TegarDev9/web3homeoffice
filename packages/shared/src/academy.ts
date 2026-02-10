export const ACADEMY_ROOM_IDS = [
  "nft-digital-ownership",
  "gaming-gamefi-metaverse",
  "social-creator-economy",
  "dao-governance",
  "identity-did-reputation",
  "infrastructure-dev-tooling",
  "oracles-interoperability-bridges",
  "storage-compute",
  "depin",
  "rwa",
  "payments-stablecoins",
  "prediction-information-markets"
] as const;

export type AcademyRoomId = (typeof ACADEMY_ROOM_IDS)[number];
export type AcademyToolId = string;

export const ACADEMY_TOOL_CATEGORIES = [
  "nft",
  "gaming",
  "socialfi",
  "dao",
  "identity",
  "infrastructure",
  "oracles",
  "storage",
  "depin",
  "rwa",
  "payments",
  "prediction"
] as const;

export type AcademyToolCategory = (typeof ACADEMY_TOOL_CATEGORIES)[number];

export type AcademyAccessLevel = "preview" | "member";
export type AcademyProgressStatus = "not_started" | "in_progress" | "completed";
