"use client";

import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const movement = {
  forward: false,
  backward: false,
  left: false,
  right: false
};

const forwardVector = new THREE.Vector3();
const rightVector = new THREE.Vector3();
const moveVector = new THREE.Vector3();
const playerPosition = new THREE.Vector3(0, 0, 8);

export function getPlayerPosition() {
  return playerPosition;
}

export function setTeleportTarget(position: [number, number, number]) {
  playerPosition.set(position[0], position[1], position[2]);
}

export function setMobileDirection(direction: "forward" | "backward" | "left" | "right", active: boolean) {
  movement[direction] = active;
}

function onKeyDown(event: KeyboardEvent) {
  if (event.code === "KeyW") movement.forward = true;
  if (event.code === "KeyS") movement.backward = true;
  if (event.code === "KeyA") movement.left = true;
  if (event.code === "KeyD") movement.right = true;
}

function onKeyUp(event: KeyboardEvent) {
  if (event.code === "KeyW") movement.forward = false;
  if (event.code === "KeyS") movement.backward = false;
  if (event.code === "KeyA") movement.left = false;
  if (event.code === "KeyD") movement.right = false;
}

export function PlayerController() {
  const speedRef = useRef(6.2);

  useEffect(() => {
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  useFrame(({ camera }, delta) => {
    const forward = Number(movement.forward) - Number(movement.backward);
    const right = Number(movement.right) - Number(movement.left);

    moveVector.set(0, 0, 0);

    if (forward !== 0 || right !== 0) {
      camera.getWorldDirection(forwardVector);
      forwardVector.y = 0;
      forwardVector.normalize();

      rightVector.crossVectors(forwardVector, camera.up).normalize();

      moveVector.addScaledVector(forwardVector, forward);
      moveVector.addScaledVector(rightVector, -right);

      if (moveVector.lengthSq() > 0.01) {
        moveVector.normalize().multiplyScalar(speedRef.current * delta);
        playerPosition.add(moveVector);
      }
    }

    playerPosition.x = THREE.MathUtils.clamp(playerPosition.x, -20, 20);
    playerPosition.z = THREE.MathUtils.clamp(playerPosition.z, -20, 20);
  });

  return null;
}


