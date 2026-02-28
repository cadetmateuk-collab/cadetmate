'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function RockingGroup({ children }: { children: React.ReactNode }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    groupRef.current.rotation.z = Math.sin(t * 0.4) * 0.008;
    groupRef.current.rotation.x = Math.sin(t * 0.3 + 1) * 0.005;
  });

  return <group ref={groupRef}>{children}</group>;
}