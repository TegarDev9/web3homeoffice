import type {
  AcademyAccessLevel,
  AcademyProgressStatus,
  AcademyRoomId,
  AcademyToolCategory,
  AcademyToolId
} from "@web3homeoffice/shared";

export type AcademyLanguage = "id" | "en";

export type AcademyRoomCatalog = {
  id: AcademyRoomId;
  slug: string;
  marker: string;
  title: string;
  subtitle: string;
  summary: string;
  summarySecondary: string;
  theme: Record<string, unknown>;
  position: [number, number, number];
  sortOrder: number;
  isPublicPreview: boolean;
  tools: AcademyToolCatalog[];
  pcStations: AcademyPcStationCatalog[];
};

export type AcademyToolCatalog = {
  id: AcademyToolId;
  roomId: AcademyRoomId;
  toolKey: string;
  name: string;
  subtitle: string;
  description: string;
  descriptionSecondary: string;
  category: AcademyToolCategory;
  difficulty: string;
  isMemberOnly: boolean;
  actionKind: "link" | "internal" | "demo";
  actionPayload: Record<string, unknown>;
  sortOrder: number;
};

export type AcademyPcStationCatalog = {
  id: string;
  roomId: AcademyRoomId;
  label: string;
  modelKey: string;
  position: [number, number, number];
  rotation: [number, number, number];
  specs: Record<string, unknown>;
};

export type AcademyProgressItem = {
  id: string;
  roomId: AcademyRoomId;
  toolId: string;
  status: AcademyProgressStatus;
  score: number | null;
  lastSeenAt: string;
  completedAt: string | null;
};

export type AcademyAccessContext = {
  accessLevel: AcademyAccessLevel;
  userId: string | null;
  hasActiveSubscription: boolean;
};
