'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

export function Radar() {
  const meshRef = useRef<THREE.Mesh>(null);
  const texture = useTexture('/shipimages/ecdis.png');

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.z = -clock.getElapsedTime() * 1.2;
  });

  return (
    <mesh
      ref={meshRef}
      position={[1.2, -0.6, -2.5]}
    >
      <planeGeometry args={[0.8, 0.8]} />
      <meshBasicMaterial
        map={texture}
        transparent
        opacity={0.9}
        depthWrite={false}
        side={THREE.FrontSide}
      />
    </mesh>
  );
}