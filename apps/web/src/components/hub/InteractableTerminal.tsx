"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Mesh } from "three";

type InteractableTerminalProps = {
  roomId: string;
  marker: string;
  reducedMotion: boolean;
  onInteract: (roomId: string) => void;
  onTeleport: (roomId: string) => void;
};

export function InteractableTerminal({
  roomId,
  marker,
  reducedMotion,
  onInteract,
  onTeleport
}: InteractableTerminalProps) {
  const meshRef = useRef<Mesh>(null);
  const markerChars = useMemo(() => marker.split(""), [marker]);

  useFrame(({ clock }) => {
    if (!meshRef.current || reducedMotion) return;
    meshRef.current.position.y = 0.35 + Math.sin(clock.elapsedTime * 2.4) * 0.08;
  });

  return (
    <group>
      <mesh
        ref={meshRef}
        position={[0, 0.35, 2.6]}
        onClick={(event) => {
          event.stopPropagation();
          onInteract(roomId);
        }}
        onDoubleClick={(event) => {
          event.stopPropagation();
          onTeleport(roomId);
        }}
      >
        <boxGeometry args={[1.8, 0.6, 0.8]} />
        <meshStandardMaterial color="#032848" emissive="#1ad7ff" emissiveIntensity={0.7} />
      </mesh>

      {markerChars.map((char, index) => (
        <mesh key={`${roomId}-${char}-${index}`} position={[-0.35 + index * 0.35, 0.8, 2.95]}>
          <boxGeometry args={[0.2, 0.2, 0.2]} />
          <meshStandardMaterial color="#90f9ff" emissive="#7ee8ff" emissiveIntensity={0.7} />
        </mesh>
      ))}
    </group>
  );
}


