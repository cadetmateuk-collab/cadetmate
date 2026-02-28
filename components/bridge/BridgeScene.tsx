'use client';

import { Suspense, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useTexture, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

function PanoramaSphere() {
  const texture = useTexture('/shipimages/panorama.webp');

  useEffect(() => {
    texture.wrapS = THREE.RepeatWrapping;
    texture.repeat.x = -1;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
  }, [texture]);

  return (
    <mesh rotation={[0, Math.PI * 0.5, 0]}>
      <sphereGeometry args={[500, 60, 40]} />
      <meshBasicMaterial map={texture} side={THREE.BackSide} />
    </mesh>
  );
}

function RockingGroup({ children }: { children: React.ReactNode }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    groupRef.current.rotation.z = Math.sin(t * 0.4) * 0.008;
  });

  return <group ref={groupRef}>{children}</group>;
}

export function BridgeScene() {
  return (
    <Canvas
      style={{ width: '100%', height: '100%' }}
      camera={{
        fov: 75,
        near: 0.1,
        far: 1000,
        position: [0, 0, 0.1],
      }}
      gl={{ antialias: true }}
      shadows={false}
    >
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        rotateSpeed={-0.3}
        minPolarAngle={Math.PI / 3}
        maxPolarAngle={Math.PI / 1.8}
        target={[0, 0, -1]}
        makeDefault
      />
      <RockingGroup>
        <Suspense fallback={null}>
          <PanoramaSphere />
        </Suspense>
      </RockingGroup>
    </Canvas>
  );
}