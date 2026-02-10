"use client";

import React from "react";
import { Compass, Monitor, PanelRightOpen } from "lucide-react";

import type { AcademyRoomId } from "@web3homeoffice/shared";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { AcademyRoomCatalog } from "@/lib/academy/types";

type AcademyQuickDockProps = {
  rooms: AcademyRoomCatalog[];
  progressByRoom: Record<string, number>;
  onTeleport: (roomId: AcademyRoomId) => void;
  onOpenRoom: (roomId: AcademyRoomId) => void;
  onOpenPractice: (roomId: AcademyRoomId) => void;
};

export function AcademyQuickDock({
  rooms,
  progressByRoom,
  onTeleport,
  onOpenRoom,
  onOpenPractice
}: AcademyQuickDockProps) {
  return (
    <Card className="max-h-56 overflow-auto p-2">
      <p className="mb-2 px-1 text-xs uppercase tracking-[0.12em] text-muted">Quick Rooms</p>
      <div className="grid gap-2">
        {rooms.map((room) => (
          <div key={room.id} className="flex items-center justify-between gap-2 rounded-md border border-border/40 p-2">
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-text">
                {room.marker} - {room.title}
              </p>
              <p className="text-[11px] text-muted">Progress {progressByRoom[room.id] ?? 0}%</p>
            </div>
            <div className="flex items-center gap-1">
              <Button size="sm" variant="secondary" onClick={() => onTeleport(room.id)}>
                <Compass className="h-3.5 w-3.5" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => onOpenRoom(room.id)}>
                <PanelRightOpen className="h-3.5 w-3.5" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => onOpenPractice(room.id)}>
                <Monitor className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
