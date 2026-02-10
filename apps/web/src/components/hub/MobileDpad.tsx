"use client";

import { setMobileDirection } from "@/components/hub/PlayerController";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type Dir = "forward" | "backward" | "left" | "right";

function bindDirection(direction: Dir) {
  return {
    onPointerDown: () => setMobileDirection(direction, true),
    onPointerUp: () => setMobileDirection(direction, false),
    onPointerCancel: () => setMobileDirection(direction, false),
    onPointerLeave: () => setMobileDirection(direction, false),
    onTouchEnd: () => setMobileDirection(direction, false)
  };
}

export function MobileDpad() {
  return (
    <Card className="grid grid-cols-3 gap-2 p-2">
      <span />
      <Button size="sm" variant="secondary" {...bindDirection("forward")}>?</Button>
      <span />
      <Button size="sm" variant="secondary" {...bindDirection("left")}>?</Button>
      <span />
      <Button size="sm" variant="secondary" {...bindDirection("right")}>?</Button>
      <span />
      <Button size="sm" variant="secondary" {...bindDirection("backward")}>?</Button>
      <span />
    </Card>
  );
}


