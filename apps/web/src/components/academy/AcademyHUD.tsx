"use client";

import React from "react";
import { Bell, CreditCard, Gamepad2, ShieldCheck, Wallet } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type AcademyHUDProps = {
  roomTitle: string;
  roomSubtitle: string;
  userEmail: string | null;
  accessLevel: "preview" | "member";
  completionPercent: number;
  isTwoDMode: boolean;
  pointerLockEnabled: boolean;
  onToggleTwoDMode: () => void;
  onTogglePointerLock: () => void;
};

export function AcademyHUD({
  roomTitle,
  roomSubtitle,
  userEmail,
  accessLevel,
  completionPercent,
  isTwoDMode,
  pointerLockEnabled,
  onToggleTwoDMode,
  onTogglePointerLock
}: AcademyHUDProps) {
  return (
    <Card className="pointer-events-auto mx-4 mt-4 flex flex-wrap items-center justify-between gap-3 p-3">
      <div className="flex items-center gap-3">
        <ShieldCheck className="h-5 w-5 text-accent" />
        <div>
          <p className="text-sm font-semibold">{roomTitle}</p>
          <p className="text-xs text-muted">{roomSubtitle}</p>
        </div>
      </div>

      <div className="hidden items-center gap-2 md:flex">
        <Badge variant={accessLevel === "member" ? "success" : "warn"}>
          {accessLevel === "member" ? "Member Full Access" : "Preview Mode"}
        </Badge>
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-black/20 px-2 py-1 text-xs text-muted">
          <Bell className="h-3.5 w-3.5 text-accent" />
          Progress {completionPercent}%
        </span>
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-black/20 px-2 py-1 text-xs text-muted">
          <Gamepad2 className="h-3.5 w-3.5 text-accent" />
          {userEmail ?? "Guest"}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm" onClick={onToggleTwoDMode}>
          {isTwoDMode ? "Switch 3D" : "Switch 2D"}
        </Button>
        <Button variant="secondary" size="sm" onClick={onTogglePointerLock}>
          {pointerLockEnabled ? "Pointer Lock On" : "Pointer Lock Off"}
        </Button>
        <Button variant="outline" size="sm" asChild>
          <a href="/billing">
            <CreditCard className="mr-2 h-4 w-4" />
            Billing
          </a>
        </Button>
        <Button variant="ghost" size="icon" aria-label="Wallet placeholder">
          <Wallet className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}
