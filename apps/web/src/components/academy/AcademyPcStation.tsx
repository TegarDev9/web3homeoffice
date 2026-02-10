"use client";

import React from "react";

import type { AcademyRoomId } from "@web3homeoffice/shared";

type AcademyPcStationProps = {
  roomId: AcademyRoomId;
  stationId: string;
  label: string;
  position: [number, number, number];
  rotation?: [number, number, number];
  onInteract: (payload: { roomId: AcademyRoomId; stationId: string }) => void;
};

export function AcademyPcStation({
  roomId,
  stationId,
  label,
  position,
  rotation = [0, 0, 0],
  onInteract
}: AcademyPcStationProps) {
  return (
    <group position={position} rotation={rotation}>
      <mesh
        castShadow
        receiveShadow
        onClick={(event) => {
          event.stopPropagation();
          onInteract({ roomId, stationId });
        }}
      >
        <boxGeometry args={[1.8, 0.8, 0.8]} />
        <meshStandardMaterial color="#0f2238" emissive="#153d61" emissiveIntensity={0.35} />
      </mesh>

      <mesh position={[0, 0.52, -0.1]}>
        <boxGeometry args={[1.1, 0.65, 0.08]} />
        <meshStandardMaterial color="#0e2f48" emissive="#21d3ff" emissiveIntensity={0.55} />
      </mesh>

      <mesh position={[0, -0.45, 0]} receiveShadow>
        <boxGeometry args={[0.18, 0.3, 0.18]} />
        <meshStandardMaterial color="#0d1a2b" />
      </mesh>

      <mesh position={[0, -0.6, 0]} receiveShadow>
        <boxGeometry args={[0.9, 0.1, 0.6]} />
        <meshStandardMaterial color="#0a1724" />
      </mesh>

      <mesh position={[0, 0.95, 0.35]}>
        <boxGeometry args={[0.9, 0.08, 0.4]} />
        <meshStandardMaterial color="#0d2035" emissive="#1fb4ff" emissiveIntensity={0.25} />
      </mesh>

      <mesh position={[0, 1.1, 0.45]}>
        <boxGeometry args={[0.9, 0.06, 0.04]} />
        <meshStandardMaterial color="#8ef7ff" emissive="#8ef7ff" emissiveIntensity={0.45} />
      </mesh>

      <group position={[0, 1.25, 0.45]}>
        {label
          .slice(0, 3)
          .split("")
          .map((char, index) => (
            <mesh key={`${stationId}-${char}-${index}`} position={[-0.14 + index * 0.14, 0, 0]}>
              <boxGeometry args={[0.06, 0.06, 0.03]} />
              <meshStandardMaterial color="#9cf2ff" emissive="#9cf2ff" emissiveIntensity={0.7} />
            </mesh>
          ))}
      </group>
    </group>
  );
}
