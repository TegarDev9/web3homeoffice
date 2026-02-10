import type { AcademyAccessLevel, AcademyRoomId } from "@web3homeoffice/shared";

import type { AcademyProgressItem, AcademyRoomCatalog } from "@/lib/academy/types";

export type AcademyPanelTab = "overview" | "tools" | "practice" | "logs";

export type AcademyClientProps = {
  userEmail: string | null;
  accessLevel: AcademyAccessLevel;
  language: "id" | "en";
  rooms: AcademyRoomCatalog[];
  progress: AcademyProgressItem[];
  roomLogs: Array<{
    roomId: AcademyRoomId;
    toolId: string | null;
    eventType: string;
    createdAt: string;
  }>;
};
