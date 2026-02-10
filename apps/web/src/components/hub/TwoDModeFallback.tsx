"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type RoomDef = {
  id: string;
  name: string;
  description: string;
  position: [number, number, number];
  marker: string;
};

type TwoDModeFallbackProps = {
  rooms: RoomDef[];
  selectedRoomId: string;
  onRoomSelect: (roomId: string) => void;
};

export function TwoDModeFallback({ rooms, selectedRoomId, onRoomSelect }: TwoDModeFallbackProps) {
  return (
    <div className="relative z-10 mx-auto grid h-[calc(100vh-64px)] w-full max-w-6xl content-start gap-4 p-4 md:grid-cols-2">
      {rooms.map((room) => (
        <Card
          key={room.id}
          className={`space-y-2 p-4 ${selectedRoomId === room.id ? "border-accent shadow-neon" : ""}`}
        >
          <p className="text-xs uppercase tracking-[0.15em] text-muted">{room.marker}</p>
          <h3 className="text-lg font-semibold text-text">{room.name}</h3>
          <p className="text-sm text-muted">{room.description}</p>
          <Button size="sm" onClick={() => onRoomSelect(room.id)}>
            Open room panel
          </Button>
        </Card>
      ))}
    </div>
  );
}


