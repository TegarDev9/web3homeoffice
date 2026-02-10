"use client";

import { useFrame } from "@react-three/fiber";
import { MathUtils, Vector3 } from "three";

import { getPlayerPosition } from "@/components/hub/PlayerController";

const desiredPosition = new Vector3();

export function CameraRig() {
  useFrame(({ camera }, delta) => {
    const player = getPlayerPosition();
    desiredPosition.set(player.x, player.y + 1.6, player.z + 0.1);
    camera.position.lerp(desiredPosition, MathUtils.clamp(delta * 8, 0, 1));
  });

  return null;
}


