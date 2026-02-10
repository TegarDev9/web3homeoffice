import { AcademyHubClient } from "@/components/academy/AcademyHubClient";
import { ensureProfileForUser } from "@/lib/auth/admin-bootstrap";
import { getCurrentUser } from "@/lib/auth/session";
import { getAcademyAccessContext } from "@/lib/academy/access";
import { listAcademyRoomsWithContent } from "@/lib/academy/catalog";
import { listAcademyActivityLogsForUser } from "@/lib/academy/logs";
import { listAcademyProgressForUser } from "@/lib/academy/progress";

export const dynamic = "force-dynamic";

export default async function AcademyPage() {
  const [user, access] = await Promise.all([getCurrentUser(), getAcademyAccessContext()]);
  const language: "id" | "en" = "id";

  if (user) {
    await ensureProfileForUser(user);
  }

  const [rooms, progress, logs] = await Promise.all([
    listAcademyRoomsWithContent({
      accessLevel: access.accessLevel,
      language
    }),
    user ? listAcademyProgressForUser(user.id) : Promise.resolve([]),
    user ? listAcademyActivityLogsForUser(user.id, 120) : Promise.resolve([])
  ]);

  return (
    <AcademyHubClient
      userEmail={user?.email ?? null}
      accessLevel={access.accessLevel}
      language={language}
      rooms={rooms}
      progress={progress}
      roomLogs={logs.map((item) => ({
        roomId: item.room_id,
        toolId: item.tool_id,
        eventType: item.event_type,
        createdAt: item.created_at
      }))}
    />
  );
}
