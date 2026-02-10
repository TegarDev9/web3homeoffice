"use client";

import type { ComponentType } from "react";
import { Bell, CreditCard, ShieldCheck, Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type BadgeItem = {
  icon: ComponentType<{ className?: string }>;
  text: string;
};

type HUDTopBarProps = {
  email: string;
  badges: BadgeItem[];
  isTwoDMode: boolean;
  pointerLockEnabled: boolean;
  onToggleTwoDMode: () => void;
  onTogglePointerLock: () => void;
};

export function HUDTopBar({
  email,
  badges,
  isTwoDMode,
  pointerLockEnabled,
  onToggleTwoDMode,
  onTogglePointerLock
}: HUDTopBarProps) {
  return (
    <Card className="pointer-events-auto mx-4 mt-4 flex flex-wrap items-center justify-between gap-3 p-3">
      <div className="flex items-center gap-3">
        <ShieldCheck className="h-5 w-5 text-accent" />
        <div>
          <p className="text-sm font-semibold">Mission Control</p>
          <p className="text-xs text-muted">{email}</p>
        </div>
      </div>

      <div className="hidden flex-wrap gap-2 md:flex">
        {badges.map((badge) => {
          const Icon = badge.icon;
          return (
            <span
              key={badge.text}
              className="inline-flex items-center gap-1 rounded-full border border-border bg-black/20 px-2 py-1 text-xs text-muted"
            >
              <Icon className="h-3.5 w-3.5 text-accent" />
              {badge.text}
            </span>
          );
        })}
      </div>

      <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm" onClick={onToggleTwoDMode}>
          {isTwoDMode ? "Switch 3D" : "Switch 2D"}
        </Button>
        <Button variant="secondary" size="sm" onClick={onTogglePointerLock}>
          {pointerLockEnabled ? "Pointer Lock On" : "Pointer Lock Off"}
        </Button>
        <Button variant="outline" size="sm">
          <Wallet className="mr-2 h-4 w-4" />
          Wallet
        </Button>
        <Button variant="ghost" size="icon" aria-label="Notifications">
          <Bell className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" aria-label="Billing">
          <CreditCard className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}


