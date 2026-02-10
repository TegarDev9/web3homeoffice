"use client";

import React from "react";
import { Monitor } from "lucide-react";

import type { AcademyRoomId } from "@web3homeoffice/shared";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { AcademyRoomCatalog } from "@/lib/academy/types";

type Academy2DFallbackProps = {
  rooms: AcademyRoomCatalog[];
  selectedRoomId: AcademyRoomId;
  accessLevel: "preview" | "member";
  progressByRoom: Record<string, number>;
  onOpenRoom: (roomId: AcademyRoomId) => void;
  onOpenPractice: (roomId: AcademyRoomId) => void;
};

export function Academy2DFallback({
  rooms,
  selectedRoomId,
  accessLevel,
  progressByRoom,
  onOpenRoom,
  onOpenPractice
}: Academy2DFallbackProps) {
  return (
    <div className="relative z-10 mx-auto grid h-[calc(100vh-64px)] w-full max-w-6xl content-start gap-4 overflow-auto p-4 md:grid-cols-2">
      {rooms.map((room) => (
        <Card
          key={room.id}
          className={`space-y-3 p-4 ${selectedRoomId === room.id ? "border-accent shadow-neon" : ""}`}
        >
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs uppercase tracking-[0.15em] text-muted">{room.marker}</p>
            <p className="text-xs text-muted">Progress {progressByRoom[room.id] ?? 0}%</p>
          </div>
          <h3 className="text-lg font-semibold text-text">{room.title}</h3>
          <p className="text-xs text-muted">{room.subtitle}</p>
          <p className="text-sm text-muted">{room.summary}</p>
          <p className="text-xs text-muted">{room.tools.length} tools tersedia</p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => onOpenRoom(room.id)}>
              Open room panel
            </Button>
            <Button size="sm" variant="secondary" onClick={() => onOpenPractice(room.id)}>
              <Monitor className="mr-2 h-3.5 w-3.5" />
              Open PC tools
            </Button>
            {accessLevel === "preview" ? (
              <Button size="sm" variant="outline" asChild>
                <a href="/billing">Upgrade to member</a>
              </Button>
            ) : null}
          </div>
        </Card>
      ))}
    </div>
  );
}
