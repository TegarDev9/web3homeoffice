"use client";

import { InteractableTerminal } from "@/components/hub/InteractableTerminal";

type RoomDef = {
  id: string;
  name: string;
  description: string;
  position: [number, number, number];
  marker: string;
};

type RoomGridProps = {
  rooms: RoomDef[];
  reducedMotion: boolean;
  onRoomInteract: (roomId: string) => void;
  onTeleport: (roomId: string) => void;
};

export function RoomGrid({ rooms, reducedMotion, onRoomInteract, onTeleport }: RoomGridProps) {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[70, 70]} />
        <meshStandardMaterial color="#04142a" />
      </mesh>

      <gridHelper args={[70, 24, "#18ffff", "#07305b"]} />

      {rooms.map((room) => (
        <group key={room.id} position={room.position}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[6, 3, 6]} />
            <meshStandardMaterial color="#091a2f" emissive="#07223f" emissiveIntensity={0.35} />
          </mesh>

          <mesh position={[0, 1.7, 0]}>
            <boxGeometry args={[4.8, 0.15, 4.8]} />
            <meshStandardMaterial color="#0b2f54" emissive="#15b4ff" emissiveIntensity={0.4} />
          </mesh>

          <InteractableTerminal
            roomId={room.id}
            marker={room.marker}
            reducedMotion={reducedMotion}
            onInteract={onRoomInteract}
            onTeleport={onTeleport}
          />
        </group>
      ))}
    </group>
  );
}


