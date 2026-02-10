"use client";

import { Compass, PanelRightOpen } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type RoomDef = {
  id: string;
  name: string;
  description: string;
  position: [number, number, number];
  marker: string;
};

type QuickActionsDockProps = {
  rooms: RoomDef[];
  onTeleport: (roomId: string) => void;
  onOpenRoom: (roomId: string) => void;
};

export function QuickActionsDock({ rooms, onTeleport, onOpenRoom }: QuickActionsDockProps) {
  return (
    <Card className="flex flex-wrap items-center gap-2 p-2">
      {rooms.map((room) => (
        <div key={room.id} className="flex items-center gap-1">
          <Button size="sm" variant="secondary" onClick={() => onTeleport(room.id)}>
            <Compass className="mr-1 h-3.5 w-3.5" />
            {room.marker}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onOpenRoom(room.id)}>
            <PanelRightOpen className="mr-1 h-3.5 w-3.5" />
            {room.name}
          </Button>
        </div>
      ))}
    </Card>
  );
}


