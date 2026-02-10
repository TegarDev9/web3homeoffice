"use client";

import React, { useMemo, useState } from "react";
import { LoaderCircle, Monitor, ShieldAlert } from "lucide-react";

import type { AcademyRoomId } from "@web3homeoffice/shared";

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
import type { AcademyRoomCatalog } from "@/lib/academy/types";
import type { AcademyPanelTab } from "@/components/academy/types";

type AcademyRoomPanelProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  room: AcademyRoomCatalog;
  accessLevel: "preview" | "member";
  activeTab: AcademyPanelTab;
  onActiveTabChange: (tab: AcademyPanelTab) => void;
  selectedStationId: string | null;
  onSelectedStationIdChange: (stationId: string) => void;
  progressByTool: Record<string, "not_started" | "in_progress" | "completed">;
  logs: string[];
  onToolLaunch: (toolId: string, roomId: AcademyRoomId) => Promise<{ ok: boolean; message: string }>;
  onProgressUpdate: (payload: {
    roomId: AcademyRoomId;
    toolId: string;
    status: "not_started" | "in_progress" | "completed";
  }) => Promise<void>;
};

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  React.useEffect(() => {
    const media = window.matchMedia("(max-width: 768px)");
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return isMobile;
}

function statusLabel(value: "not_started" | "in_progress" | "completed") {
  if (value === "completed") return "Completed";
  if (value === "in_progress") return "In progress";
  return "Not started";
}

function AcademyRoomTabs({
  room,
  accessLevel,
  activeTab,
  onActiveTabChange,
  selectedStationId,
  onSelectedStationIdChange,
  progressByTool,
  logs,
  onToolLaunch,
  onProgressUpdate
}: Omit<AcademyRoomPanelProps, "open" | "onOpenChange">) {
  const [busyToolId, setBusyToolId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const selectedStation = useMemo(
    () => room.pcStations.find((station) => station.id === selectedStationId) ?? room.pcStations[0] ?? null,
    [room.pcStations, selectedStationId]
  );

  const onLaunch = async (toolId: string) => {
    setBusyToolId(toolId);
    setMessage(null);
    const result = await onToolLaunch(toolId, room.id);
    setMessage(result.message);
    setBusyToolId(null);
  };

  return (
    <Tabs value={activeTab} onValueChange={(tab) => onActiveTabChange(tab as AcademyPanelTab)}>
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="tools">Tools</TabsTrigger>
        <TabsTrigger value="practice">Practice</TabsTrigger>
        <TabsTrigger value="logs">Logs</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-3">
        <p className="text-sm text-muted">{room.summary}</p>
        <p className="text-xs text-muted">{room.summarySecondary}</p>
        <p className="text-xs text-muted">Coordinates: [{room.position.join(", ")}]</p>
        <p className="text-xs text-muted">
          Access: {accessLevel === "member" ? "Full member tools enabled." : "Preview mode (member tools locked)."}
        </p>
      </TabsContent>

      <TabsContent value="tools" className="space-y-2">
        {room.tools.map((tool) => {
          const progress = progressByTool[tool.id] ?? "not_started";
          const blocked = accessLevel === "preview" && tool.isMemberOnly;

          return (
            <div key={tool.id} className="space-y-2 rounded-md border border-border/60 bg-black/20 p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-text">{tool.name}</p>
                  <p className="text-xs text-muted">{tool.subtitle}</p>
                  <p className="mt-1 text-sm text-muted">{tool.description}</p>
                </div>
                <div className="text-right text-[11px] text-muted">
                  <p>{tool.difficulty}</p>
                  <p>{statusLabel(progress)}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={() => onLaunch(tool.id)} disabled={busyToolId === tool.id}>
                  {busyToolId === tool.id ? <LoaderCircle className="mr-2 h-3.5 w-3.5 animate-spin" /> : null}
                  Launch
                </Button>

                {accessLevel === "member" ? (
                  <>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => void onProgressUpdate({ roomId: room.id, toolId: tool.id, status: "in_progress" })}
                    >
                      Mark in progress
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => void onProgressUpdate({ roomId: room.id, toolId: tool.id, status: "completed" })}
                    >
                      Mark completed
                    </Button>
                  </>
                ) : null}

                {blocked ? (
                  <Button size="sm" variant="outline" asChild>
                    <a href="/billing">
                      <ShieldAlert className="mr-2 h-3.5 w-3.5" />
                      Member only
                    </a>
                  </Button>
                ) : null}
              </div>
            </div>
          );
        })}

        {message ? <p className="text-xs text-muted">{message}</p> : null}
      </TabsContent>

      <TabsContent value="practice" className="space-y-2">
        <p className="text-xs text-muted">PC stations inside this room. Select one to inspect tools setup.</p>

        <div className="flex flex-wrap gap-2">
          {room.pcStations.map((station) => (
            <Button
              key={station.id}
              size="sm"
              variant={selectedStation?.id === station.id ? "secondary" : "ghost"}
              onClick={() => onSelectedStationIdChange(station.id)}
            >
              <Monitor className="mr-2 h-3.5 w-3.5" />
              {station.label}
            </Button>
          ))}
        </div>

        {selectedStation ? (
          <div className="space-y-1 rounded-md border border-border/60 bg-black/20 p-3 text-xs text-muted">
            <p className="font-medium text-text">Model: {selectedStation.modelKey}</p>
            {Object.entries(selectedStation.specs).map(([key, value]) => (
              <p key={key}>
                {key}: {String(value)}
              </p>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted">No PC station data.</p>
        )}
      </TabsContent>

      <TabsContent value="logs" className="max-h-64 space-y-1 overflow-auto">
        {logs.length ? (
          logs.map((line, index) => (
            <p key={`${line}-${index}`} className="text-xs text-muted">
              {line}
            </p>
          ))
        ) : (
          <p className="text-xs text-muted">No activity logs for this room yet.</p>
        )}
      </TabsContent>
    </Tabs>
  );
}

export function AcademyRoomPanel(props: AcademyRoomPanelProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Sheet open={props.open} onOpenChange={props.onOpenChange}>
        <SheetContent side="bottom" className="max-h-[86vh] overflow-auto rounded-t-lg border-t">
          <SheetHeader>
            <SheetTitle>{props.room.title}</SheetTitle>
            <SheetDescription>{props.room.subtitle}</SheetDescription>
          </SheetHeader>
          <AcademyRoomTabs {...props} />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="max-h-[82vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>{props.room.title}</DialogTitle>
          <DialogDescription>{props.room.subtitle}</DialogDescription>
        </DialogHeader>
        <AcademyRoomTabs {...props} />
      </DialogContent>
    </Dialog>
  );
}
