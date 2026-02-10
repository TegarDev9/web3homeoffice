"use client";

import React, { useEffect, useMemo, useState } from "react";

import type { AcademyRoomId } from "@web3homeoffice/shared";

import { getPlayerPosition } from "@/components/hub/PlayerController";
import { Card } from "@/components/ui/card";
import type { AcademyRoomCatalog } from "@/lib/academy/types";

type AcademyMiniMapProps = {
  rooms: AcademyRoomCatalog[];
  selectedRoomId: AcademyRoomId;
};

export function AcademyMiniMap({ rooms, selectedRoomId }: AcademyMiniMapProps) {
  const points = useMemo(
    () =>
      rooms.map((room) => ({
        id: room.id,
        marker: room.marker,
        x: room.position[0],
        z: room.position[2]
      })),
    [rooms]
  );

  const [player, setPlayer] = useState({ x: 0, z: 0 });

  useEffect(() => {
    const timer = window.setInterval(() => {
      const position = getPlayerPosition();
      setPlayer({ x: position.x, z: position.z });
    }, 120);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <Card className="w-64 p-3">
      <p className="mb-2 text-xs uppercase tracking-[0.15em] text-muted">Academy Map</p>
      <div className="relative h-44 rounded-md border border-border bg-black/20">
        {points.map((point) => (
          <div
            key={point.id}
            className="absolute -translate-x-1/2 -translate-y-1/2 rounded bg-black/70 px-1.5 py-0.5 text-[10px]"
            style={{
              left: `${50 + point.x * 1.4}%`,
              top: `${50 + point.z * 1.4}%`,
              color: point.id === selectedRoomId ? "#20d4ff" : "#e2e8f0"
            }}
          >
            {point.marker}
          </div>
        ))}
        <div
          className="absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent shadow-neon"
          style={{
            left: `${50 + player.x * 1.4}%`,
            top: `${50 + player.z * 1.4}%`
          }}
        />
      </div>
    </Card>
  );
}
