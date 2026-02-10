"use client";

import { Canvas } from "@react-three/fiber";
import { PointerLockControls, Stars } from "@react-three/drei";

import { CameraRig } from "@/components/hub/CameraRig";
import { PlayerController } from "@/components/hub/PlayerController";
import { RoomGrid } from "@/components/hub/RoomGrid";
import type { GraphicsQuality } from "@/types/domain";

type RoomDef = {
  id: string;
  name: string;
  description: string;
  position: [number, number, number];
  marker: string;
};

type SceneCanvasProps = {
  rooms: RoomDef[];
  quality: GraphicsQuality;
  reducedMotion: boolean;
  pointerLockEnabled: boolean;
  onRoomInteract: (roomId: string) => void;
  onTeleport: (roomId: string) => void;
};

const QUALITY_PRESET = {
  low: { stars: 120, shadows: false, fogFar: 28, dpr: 1 },
  medium: { stars: 400, shadows: false, fogFar: 36, dpr: 1.4 },
  high: { stars: 800, shadows: true, fogFar: 48, dpr: 2 }
} as const;

export function SceneCanvas({ rooms, quality, reducedMotion, pointerLockEnabled, onRoomInteract, onTeleport }: SceneCanvasProps) {
  const preset = QUALITY_PRESET[quality];

  return (
    <div id="hub-canvas-wrapper" className="h-[calc(100vh-64px)] w-full">
      <Canvas camera={{ position: [0, 2, 12], fov: 60 }} shadows={preset.shadows} dpr={[1, preset.dpr]}>
        <color attach="background" args={["#020617"]} />
        <fog attach="fog" args={["#020617", 7, preset.fogFar]} />
        <ambientLight intensity={0.45} />
        <directionalLight position={[6, 12, 2]} intensity={0.8} castShadow={preset.shadows} />

        {!reducedMotion ? <Stars count={preset.stars} radius={60} depth={40} factor={2} saturation={0} fade speed={0.5} /> : null}

        <RoomGrid
          rooms={rooms}
          onRoomInteract={onRoomInteract}
          onTeleport={onTeleport}
          reducedMotion={reducedMotion}
        />

        <PlayerController />
        <CameraRig />

        {pointerLockEnabled ? <PointerLockControls selector="#hub-canvas-wrapper" /> : null}
      </Canvas>
    </div>
  );
}


