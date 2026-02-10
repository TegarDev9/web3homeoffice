"use client";

import type { GraphicsQuality } from "@/types/domain";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

type SettingsPanelProps = {
  quality: GraphicsQuality;
  reducedMotion: boolean;
  onQualityChange: (quality: GraphicsQuality) => void;
  onReducedMotionChange: (value: boolean) => void;
};

export function SettingsPanel({
  quality,
  reducedMotion,
  onQualityChange,
  onReducedMotionChange
}: SettingsPanelProps) {
  return (
    <Card className="pointer-events-auto space-y-3 p-3">
      <p className="text-xs uppercase tracking-[0.15em] text-muted">Settings</p>
      <div className="space-y-2">
        <Label htmlFor="graphics-quality">Graphics quality</Label>
        <Select value={quality} onValueChange={(value) => onQualityChange(value as GraphicsQuality)}>
          <SelectTrigger id="graphics-quality">
            <SelectValue placeholder="Select quality" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center justify-between">
        <Label htmlFor="reduced-motion">Reduced motion</Label>
        <Switch
          id="reduced-motion"
          checked={reducedMotion}
          onCheckedChange={(value) => onReducedMotionChange(value)}
        />
      </div>
    </Card>
  );
}


