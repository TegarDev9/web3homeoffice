"use client";

import { useMemo, useState } from "react";
import { Bell, Compass, Gamepad2, Radar, ShieldCheck } from "lucide-react";

import { setTeleportTarget } from "@/components/hub/PlayerController";
import { HUDTopBar } from "@/components/hub/HUDTopBar";
import { MiniMap } from "@/components/hub/MiniMap";
import { MobileDpad } from "@/components/hub/MobileDpad";
import { QuickActionsDock } from "@/components/hub/QuickActionsDock";
import { RoomPanel } from "@/components/hub/RoomPanel";
import { SceneCanvas } from "@/components/hub/SceneCanvas";
import { SettingsPanel } from "@/components/hub/SettingsPanel";
import { TwoDModeFallback } from "@/components/hub/TwoDModeFallback";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { detectPlatformContext } from "@/lib/platforms/detect";
import type { GraphicsQuality } from "@/types/domain";

type RoomDef = {
  id: string;
  name: string;
  description: string;
  position: [number, number, number];
  marker: string;
};

type ProvisionJobSummary = {
  id: string;
  status: string;
  logs: unknown;
};

type OfficeHubClientProps = {
  userEmail: string;
  subscriptionStatus: string;
  jobs: ProvisionJobSummary[];
};

const ROOMS: RoomDef[] = [
  {
    id: "command",
    name: "Command Nexus",
    description: "Global status, alerts, and infra overview.",
    position: [0, 0, 0],
    marker: "CN"
  },
  {
    id: "provision",
    name: "Provision Bay",
    description: "Launch and inspect Tencent Cloud instances.",
    position: [10, 0, 0],
    marker: "PB"
  },
  {
    id: "billing",
    name: "Billing Core",
    description: "Manage plan, invoices, and subscription lifecycle.",
    position: [-10, 0, 0],
    marker: "BC"
  },
  {
    id: "security",
    name: "Security Lab",
    description: "SSH keys, hardening profile, and audit timelines.",
    position: [0, 0, -10],
    marker: "SL"
  },
  {
    id: "telemetry",
    name: "Telemetry Deck",
    description: "Job logs and system traces by workload.",
    position: [0, 0, 10],
    marker: "TD"
  }
];

export function OfficeHubClient({ userEmail, subscriptionStatus, jobs }: OfficeHubClientProps) {
  const platform = useMemo(() => detectPlatformContext(), []);
  const [quality, setQuality] = useState<GraphicsQuality>(platform.shouldDefaultLowGraphics ? "low" : "medium");
  const [reducedMotion, setReducedMotion] = useState<boolean>(platform.shouldDefaultLowGraphics);
  const [isTwoDMode, setIsTwoDMode] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<string>(ROOMS[0].id);
  const [roomPanelOpen, setRoomPanelOpen] = useState(false);
  const [pointerLockEnabled, setPointerLockEnabled] = useState(false);

  const roomById = useMemo(() => new Map(ROOMS.map((room) => [room.id, room])), []);

  const selectedRoom = roomById.get(selectedRoomId) ?? ROOMS[0];

  const teleportToRoom = (roomId: string) => {
    const room = roomById.get(roomId);
    if (!room) return;

    setSelectedRoomId(roomId);
    setTeleportTarget([room.position[0], room.position[1], room.position[2] + 3.4]);
  };

  const hudBadges = [
    { icon: ShieldCheck, text: `Subscription: ${subscriptionStatus}` },
    { icon: Bell, text: `Jobs: ${jobs.length}` },
    { icon: Compass, text: `Platform: ${platform.isTelegram ? "Telegram" : "Web"}` }
  ];

  return (
    <div className="relative min-h-[calc(100vh-64px)] overflow-hidden rounded-xl border border-border/50 bg-black/30">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(10,200,255,0.2),transparent_40%),radial-gradient(circle_at_90%_20%,rgba(255,57,184,0.2),transparent_35%),radial-gradient(circle_at_40%_90%,rgba(72,255,170,0.16),transparent_30%)]" />
      {isTwoDMode ? (
        <TwoDModeFallback
          rooms={ROOMS}
          selectedRoomId={selectedRoom.id}
          onRoomSelect={(roomId) => {
            teleportToRoom(roomId);
            setRoomPanelOpen(true);
          }}
        />
      ) : (
        <SceneCanvas
          rooms={ROOMS}
          quality={quality}
          reducedMotion={reducedMotion}
          pointerLockEnabled={pointerLockEnabled}
          onRoomInteract={(roomId) => {
            setSelectedRoomId(roomId);
            setRoomPanelOpen(true);
          }}
          onTeleport={teleportToRoom}
        />
      )}

      <div className="pointer-events-none absolute inset-0">
        <HUDTopBar
          email={userEmail}
          badges={hudBadges}
          isTwoDMode={isTwoDMode}
          onToggleTwoDMode={() => setIsTwoDMode((current) => !current)}
          pointerLockEnabled={pointerLockEnabled}
          onTogglePointerLock={() => setPointerLockEnabled((current) => !current)}
        />

        <div className="pointer-events-auto absolute bottom-4 left-4 hidden md:block">
          <MiniMap rooms={ROOMS} selectedRoomId={selectedRoom.id} />
        </div>

        <div className="pointer-events-auto absolute bottom-4 right-4 max-w-[min(620px,92vw)]">
          <QuickActionsDock
            rooms={ROOMS}
            onTeleport={(roomId) => {
              teleportToRoom(roomId);
            }}
            onOpenRoom={(roomId) => {
              setSelectedRoomId(roomId);
              setRoomPanelOpen(true);
            }}
          />
        </div>

        <div className="pointer-events-auto absolute right-4 top-20 w-[290px]">
          <SettingsPanel
            quality={quality}
            reducedMotion={reducedMotion}
            onQualityChange={setQuality}
            onReducedMotionChange={setReducedMotion}
          />
        </div>

        <div className="pointer-events-auto absolute bottom-4 left-1/2 z-20 -translate-x-1/2 md:hidden">
          <MobileDpad />
        </div>
      </div>

      <RoomPanel
        open={roomPanelOpen}
        onOpenChange={setRoomPanelOpen}
        room={selectedRoom}
        logs={jobs.map((job) => `#${job.id} ${job.status}`)}
      />

      <Card className="pointer-events-none absolute left-4 top-20 hidden p-3 md:block">
        <div className="flex items-center gap-2 text-xs text-muted">
          <Gamepad2 className="h-4 w-4 text-accent" />
          WASD to move, click terminal to interact
        </div>
      </Card>

      <div className="pointer-events-auto absolute bottom-4 left-1/2 z-20 -translate-x-1/2 md:hidden">
        <Button variant="secondary" size="sm" onClick={() => setRoomPanelOpen(true)}>
          <Radar className="mr-2 h-4 w-4" />
          Open {selectedRoom.name}
        </Button>
      </div>

      <div className="absolute right-4 top-4 z-20">
        <Badge>{quality.toUpperCase()}</Badge>
      </div>
    </div>
  );
}


