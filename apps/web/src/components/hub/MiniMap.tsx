"use client";

import { useEffect, useMemo, useState } from "react";

import { getPlayerPosition } from "@/components/hub/PlayerController";
import { Card } from "@/components/ui/card";

type RoomDef = {
  id: string;
  name: string;
  description: string;
  position: [number, number, number];
  marker: string;
};

type MiniMapProps = {
  rooms: RoomDef[];
  selectedRoomId: string;
};

export function MiniMap({ rooms, selectedRoomId }: MiniMapProps) {
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
    <Card className="w-56 p-3">
      <p className="mb-2 text-xs uppercase tracking-[0.15em] text-muted">Mini Map</p>
      <div className="relative h-40 rounded-md border border-border bg-black/20">
        {points.map((point) => (
          <div
            key={point.id}
            className="absolute -translate-x-1/2 -translate-y-1/2 rounded bg-black/70 px-1.5 py-0.5 text-[10px]"
            style={{
              left: `${50 + point.x * 2}%`,
              top: `${50 + point.z * 2}%`,
              color: point.id === selectedRoomId ? "#20d4ff" : "#e2e8f0"
            }}
          >
            {point.marker}
          </div>
        ))}

        <div
          className="absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent shadow-neon"
          style={{
            left: `${50 + player.x * 2}%`,
            top: `${50 + player.z * 2}%`
          }}
        />
      </div>
    </Card>
  );
}


