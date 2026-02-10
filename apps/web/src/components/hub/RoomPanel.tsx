"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type RoomDef = {
  id: string;
  name: string;
  description: string;
  position: [number, number, number];
  marker: string;
};

type RoomPanelProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  room: RoomDef;
  logs: string[];
};

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 768px)");
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener("change", update);

    return () => media.removeEventListener("change", update);
  }, []);

  return isMobile;
}

function RoomTabs({ room, logs }: { room: RoomDef; logs: string[] }) {
  return (
    <Tabs defaultValue="overview">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="actions">Actions</TabsTrigger>
        <TabsTrigger value="logs">Logs</TabsTrigger>
      </TabsList>
      <TabsContent value="overview" className="space-y-2">
        <p className="text-sm text-muted">{room.description}</p>
        <p className="text-xs text-muted">Coordinates: [{room.position.join(", ")}]</p>
      </TabsContent>
      <TabsContent value="actions" className="space-y-2">
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <a href="/dashboard">Open dashboard</a>
          </Button>
          <Button variant="secondary" asChild>
            <a href="/billing">Manage subscription</a>
          </Button>
          <Button variant="outline" asChild>
            <a href="/dashboard#provision">Provision VPS</a>
          </Button>
        </div>
      </TabsContent>
      <TabsContent value="logs" className="max-h-60 space-y-1 overflow-auto">
        {logs.length ? (
          logs.map((line, index) => (
            <p key={`${line}-${index}`} className="text-xs text-muted">
              {line}
            </p>
          ))
        ) : (
          <p className="text-xs text-muted">No logs yet.</p>
        )}
      </TabsContent>
    </Tabs>
  );
}

export function RoomPanel({ open, onOpenChange, room, logs }: RoomPanelProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="max-h-[82vh] overflow-auto rounded-t-lg border-t">
          <SheetHeader>
            <SheetTitle>{room.name}</SheetTitle>
            <SheetDescription>Interactive room controls and status.</SheetDescription>
          </SheetHeader>
          <RoomTabs room={room} logs={logs} />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{room.name}</DialogTitle>
          <DialogDescription>Interactive room controls and status.</DialogDescription>
        </DialogHeader>
        <RoomTabs room={room} logs={logs} />
      </DialogContent>
    </Dialog>
  );
}


