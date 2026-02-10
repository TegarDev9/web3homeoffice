"use client";

import React, { useMemo, useState } from "react";
import { GraduationCap, Radar } from "lucide-react";

import type { AcademyRoomId } from "@web3homeoffice/shared";

import { Academy2DFallback } from "@/components/academy/Academy2DFallback";
import { AcademyHUD } from "@/components/academy/AcademyHUD";
import { AcademyMiniMap } from "@/components/academy/AcademyMiniMap";
import { AcademyQuickDock } from "@/components/academy/AcademyQuickDock";
import { AcademyRoomPanel } from "@/components/academy/AcademyRoomPanel";
import { AcademySceneCanvas } from "@/components/academy/AcademySceneCanvas";
import type { AcademyClientProps, AcademyPanelTab } from "@/components/academy/types";
import { setTeleportTarget } from "@/components/hub/PlayerController";
import { MobileDpad } from "@/components/hub/MobileDpad";
import { SettingsPanel } from "@/components/hub/SettingsPanel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { detectPlatformContext } from "@/lib/platforms/detect";
import type { GraphicsQuality } from "@/types/domain";

export function AcademyHubClient({
  userEmail,
  accessLevel,
  language,
  rooms,
  progress,
  roomLogs
}: AcademyClientProps) {
  const platform = useMemo(() => detectPlatformContext(), []);
  const [quality, setQuality] = useState<GraphicsQuality>(platform.shouldDefaultLowGraphics ? "low" : "medium");
  const [reducedMotion, setReducedMotion] = useState<boolean>(platform.shouldDefaultLowGraphics);
  const [isTwoDMode, setIsTwoDMode] = useState(false);
  const [pointerLockEnabled, setPointerLockEnabled] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<AcademyRoomId | null>(rooms[0]?.id ?? null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelTab, setPanelTab] = useState<AcademyPanelTab>("overview");
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null);
  const [progressState, setProgressState] = useState(progress);

  const roomById = useMemo(() => new Map(rooms.map((room) => [room.id, room])), [rooms]);
  const selectedRoom = (selectedRoomId ? roomById.get(selectedRoomId) : null) ?? rooms[0];

  const progressByTool = useMemo(() => {
    const map: Record<string, "not_started" | "in_progress" | "completed"> = {};
    for (const item of progressState) {
      map[item.toolId] = item.status;
    }
    return map;
  }, [progressState]);

  const progressByRoom = useMemo(() => {
    const map: Record<string, number> = {};
    for (const room of rooms) {
      const total = room.tools.length;
      if (!total) {
        map[room.id] = 0;
        continue;
      }
      const completed = room.tools.filter((tool) => progressByTool[tool.id] === "completed").length;
      map[room.id] = Math.round((completed / total) * 100);
    }
    return map;
  }, [rooms, progressByTool]);

  const selectedRoomCompletion = selectedRoom ? progressByRoom[selectedRoom.id] ?? 0 : 0;

  const logsByRoom = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const log of roomLogs) {
      if (!map[log.roomId]) map[log.roomId] = [];
      map[log.roomId].push(`${new Date(log.createdAt).toLocaleString()} - ${log.eventType}`);
    }
    return map;
  }, [roomLogs]);

  const openRoomPanel = (roomId: AcademyRoomId, tab: AcademyPanelTab) => {
    setSelectedRoomId(roomId);
    setPanelTab(tab);
    const room = roomById.get(roomId);
    setSelectedStationId(room?.pcStations[0]?.id ?? null);
    setPanelOpen(true);
  };

  const teleportToRoom = (roomId: AcademyRoomId) => {
    const room = roomById.get(roomId);
    if (!room) return;
    setSelectedRoomId(roomId);
    setTeleportTarget([room.position[0], room.position[1], room.position[2] + 3.8]);
  };

  const onToolLaunch = async (toolId: string, roomId: AcademyRoomId) => {
    try {
      const response = await fetch(`/api/academy/tools/${toolId}/launch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ roomId, context: "academy-hub" })
      });
      const payload = (await response.json()) as
        | {
            allowed: boolean;
            tool: {
              actionKind: "link" | "internal" | "demo";
              actionPayload: Record<string, unknown>;
            };
          }
        | { error: { message: string } };

      if (!response.ok || "error" in payload) {
        return { ok: false, message: "error" in payload ? payload.error.message : "Unable to launch tool" };
      }

      if (payload.tool.actionKind === "link") {
        const href = String(payload.tool.actionPayload.href ?? "");
        if (href) window.open(href, "_blank", "noopener,noreferrer");
      } else if (payload.tool.actionKind === "internal") {
        const route = String(payload.tool.actionPayload.route ?? "");
        if (route) window.location.href = route;
      }

      return { ok: true, message: payload.tool.actionKind === "demo" ? "Demo mode launched." : "Tool launched." };
    } catch (error) {
      return {
        ok: false,
        message: error instanceof Error ? error.message : "Unable to launch tool"
      };
    }
  };

  const onProgressUpdate = async (payload: {
    roomId: AcademyRoomId;
    toolId: string;
    status: "not_started" | "in_progress" | "completed";
  }) => {
    try {
      const response = await fetch("/api/academy/progress", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          roomId: payload.roomId,
          toolId: payload.toolId,
          status: payload.status
        })
      });

      const body = (await response.json()) as
        | {
            progress: {
              id: string;
              roomId: AcademyRoomId;
              toolId: string;
              status: "not_started" | "in_progress" | "completed";
              score: number | null;
              lastSeenAt: string;
              completedAt: string | null;
            };
          }
        | { error: { message: string } };

      if (!response.ok || "error" in body) return;

      setProgressState((current) => {
        const withoutTool = current.filter((item) => item.toolId !== body.progress.toolId);
        return [...withoutTool, body.progress];
      });
    } catch {
      // Keep UI responsive even when progress endpoint fails.
    }
  };

  if (!selectedRoom) {
    return (
      <Card className="p-6">
        <p className="text-sm text-muted">No academy rooms available.</p>
      </Card>
    );
  }

  return (
    <div className="relative min-h-[calc(100vh-64px)] overflow-hidden rounded-xl border border-border/50 bg-black/30">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(10,200,255,0.2),transparent_40%),radial-gradient(circle_at_90%_20%,rgba(255,57,184,0.2),transparent_35%),radial-gradient(circle_at_40%_90%,rgba(72,255,170,0.16),transparent_30%)]" />

      {isTwoDMode ? (
        <Academy2DFallback
          rooms={rooms}
          selectedRoomId={selectedRoom.id}
          accessLevel={accessLevel}
          progressByRoom={progressByRoom}
          onOpenRoom={(roomId) => openRoomPanel(roomId, "overview")}
          onOpenPractice={(roomId) => openRoomPanel(roomId, "practice")}
        />
      ) : (
        <AcademySceneCanvas
          rooms={rooms}
          quality={quality}
          reducedMotion={reducedMotion}
          pointerLockEnabled={pointerLockEnabled}
          onTerminalInteract={(roomId) => openRoomPanel(roomId, "overview")}
          onTeleport={teleportToRoom}
          onPcInteract={({ roomId, stationId }) => {
            setSelectedStationId(stationId);
            openRoomPanel(roomId, "practice");
          }}
        />
      )}

      <div className="pointer-events-none absolute inset-0">
        <AcademyHUD
          roomTitle={selectedRoom.title}
          roomSubtitle={language === "id" ? "Web3 Academy Room" : "Web3 Academy Room"}
          userEmail={userEmail}
          accessLevel={accessLevel}
          completionPercent={selectedRoomCompletion}
          isTwoDMode={isTwoDMode}
          pointerLockEnabled={pointerLockEnabled}
          onToggleTwoDMode={() => setIsTwoDMode((current) => !current)}
          onTogglePointerLock={() => setPointerLockEnabled((current) => !current)}
        />

        <div className="pointer-events-auto absolute bottom-4 left-4 hidden md:block">
          <AcademyMiniMap rooms={rooms} selectedRoomId={selectedRoom.id} />
        </div>

        <div className="pointer-events-auto absolute bottom-4 right-4 w-[min(440px,94vw)]">
          <AcademyQuickDock
            rooms={rooms}
            progressByRoom={progressByRoom}
            onTeleport={teleportToRoom}
            onOpenRoom={(roomId) => openRoomPanel(roomId, "overview")}
            onOpenPractice={(roomId) => openRoomPanel(roomId, "practice")}
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

      <AcademyRoomPanel
        open={panelOpen}
        onOpenChange={setPanelOpen}
        room={selectedRoom}
        accessLevel={accessLevel}
        activeTab={panelTab}
        onActiveTabChange={setPanelTab}
        selectedStationId={selectedStationId}
        onSelectedStationIdChange={setSelectedStationId}
        progressByTool={progressByTool}
        logs={logsByRoom[selectedRoom.id] ?? []}
        onToolLaunch={onToolLaunch}
        onProgressUpdate={onProgressUpdate}
      />

      <Card className="pointer-events-none absolute left-4 top-20 hidden p-3 md:block">
        <div className="flex items-center gap-2 text-xs text-muted">
          <GraduationCap className="h-4 w-4 text-accent" />
          {language === "id" ? "WASD + klik terminal/PC untuk belajar" : "WASD + click terminal/PC to learn"}
        </div>
      </Card>

      <div className="pointer-events-auto absolute bottom-4 left-1/2 z-20 -translate-x-1/2 md:hidden">
        <Button variant="secondary" size="sm" onClick={() => openRoomPanel(selectedRoom.id, "overview")}>
          <Radar className="mr-2 h-4 w-4" />
          Open {selectedRoom.marker}
        </Button>
      </div>

      <div className="absolute right-4 top-4 z-20 flex items-center gap-2">
        <Badge>{quality.toUpperCase()}</Badge>
        <Badge variant={accessLevel === "member" ? "success" : "warn"}>
          {accessLevel === "member" ? "MEMBER" : "PREVIEW"}
        </Badge>
      </div>
    </div>
  );
}
