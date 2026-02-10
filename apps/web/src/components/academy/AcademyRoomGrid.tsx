"use client";

import React from "react";

import type { AcademyRoomId } from "@web3homeoffice/shared";

import { AcademyPcStation } from "@/components/academy/AcademyPcStation";
import { InteractableTerminal } from "@/components/hub/InteractableTerminal";
import type { AcademyRoomCatalog } from "@/lib/academy/types";

type AcademyRoomGridProps = {
  rooms: AcademyRoomCatalog[];
  reducedMotion: boolean;
  onTerminalInteract: (roomId: AcademyRoomId) => void;
  onTeleport: (roomId: AcademyRoomId) => void;
  onPcInteract: (payload: { roomId: AcademyRoomId; stationId: string }) => void;
};

export function AcademyRoomGrid({
  rooms,
  reducedMotion,
  onTerminalInteract,
  onTeleport,
  onPcInteract
}: AcademyRoomGridProps) {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[120, 120]} />
        <meshStandardMaterial color="#041226" />
      </mesh>

      <gridHelper args={[120, 40, "#17cfff", "#073059"]} />

      {rooms.map((room) => (
        <group key={room.id} position={room.position}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[6.8, 3.2, 6.8]} />
            <meshStandardMaterial color="#09192e" emissive="#071f38" emissiveIntensity={0.38} />
          </mesh>

          <mesh position={[0, 1.85, 0]}>
            <boxGeometry args={[5.6, 0.15, 5.6]} />
            <meshStandardMaterial color="#0c3359" emissive="#1fd6ff" emissiveIntensity={0.42} />
          </mesh>

          <mesh position={[0, 1.2, -2.8]}>
            <boxGeometry args={[2.6, 0.35, 0.2]} />
            <meshStandardMaterial color="#0f3459" emissive="#20d4ff" emissiveIntensity={0.5} />
          </mesh>

          <InteractableTerminal
            roomId={room.id}
            marker={room.marker}
            reducedMotion={reducedMotion}
            onInteract={(roomId) => onTerminalInteract(roomId as AcademyRoomId)}
            onTeleport={(roomId) => onTeleport(roomId as AcademyRoomId)}
          />
        </group>
      ))}

      {rooms.flatMap((room) =>
        room.pcStations.map((station) => (
          <AcademyPcStation
            key={station.id}
            roomId={room.id}
            stationId={station.id}
            label={station.label}
            position={station.position}
            rotation={station.rotation}
            onInteract={onPcInteract}
          />
        ))
      )}
    </group>
  );
}
