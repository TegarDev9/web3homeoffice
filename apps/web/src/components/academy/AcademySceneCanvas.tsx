"use client";

import React from "react";
import { PointerLockControls, Stars } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";

import type { AcademyRoomId } from "@web3homeoffice/shared";

import { AcademyRoomGrid } from "@/components/academy/AcademyRoomGrid";
import { CameraRig } from "@/components/hub/CameraRig";
import { PlayerController } from "@/components/hub/PlayerController";
import type { AcademyRoomCatalog } from "@/lib/academy/types";
import type { GraphicsQuality } from "@/types/domain";

type AcademySceneCanvasProps = {
  rooms: AcademyRoomCatalog[];
  quality: GraphicsQuality;
  reducedMotion: boolean;
  pointerLockEnabled: boolean;
  onTerminalInteract: (roomId: AcademyRoomId) => void;
  onTeleport: (roomId: AcademyRoomId) => void;
  onPcInteract: (payload: { roomId: AcademyRoomId; stationId: string }) => void;
};

const QUALITY_PRESET = {
  low: { stars: 180, shadows: false, fogFar: 58, dpr: 1 },
  medium: { stars: 520, shadows: false, fogFar: 74, dpr: 1.4 },
  high: { stars: 980, shadows: true, fogFar: 92, dpr: 2 }
} as const;

export function AcademySceneCanvas({
  rooms,
  quality,
  reducedMotion,
  pointerLockEnabled,
  onTerminalInteract,
  onTeleport,
  onPcInteract
}: AcademySceneCanvasProps) {
  const preset = QUALITY_PRESET[quality];

  return (
    <div id="academy-canvas-wrapper" className="h-[calc(100vh-64px)] w-full">
      <Canvas camera={{ position: [0, 2, 14], fov: 60 }} shadows={preset.shadows} dpr={[1, preset.dpr]}>
        <color attach="background" args={["#020617"]} />
        <fog attach="fog" args={["#020617", 8, preset.fogFar]} />
        <ambientLight intensity={0.47} />
        <directionalLight position={[8, 16, 4]} intensity={0.82} castShadow={preset.shadows} />

        {!reducedMotion ? <Stars count={preset.stars} radius={90} depth={60} factor={2} fade speed={0.55} /> : null}

        <AcademyRoomGrid
          rooms={rooms}
          reducedMotion={reducedMotion}
          onTerminalInteract={onTerminalInteract}
          onTeleport={onTeleport}
          onPcInteract={onPcInteract}
        />

        <PlayerController />
        <CameraRig />

        {pointerLockEnabled ? <PointerLockControls selector="#academy-canvas-wrapper" /> : null}
      </Canvas>
    </div>
  );
}
