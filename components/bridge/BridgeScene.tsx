'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useTexture, OrbitControls, useProgress, Preload } from '@react-three/drei';
import type { OrbitControls as OrbitControlsType } from 'three-stdlib';
import * as THREE from 'three';

// ══════════════════════════════════════════════════════════════════════════════
// TO ADD A NEW CAMERA NODE:
//   1. Add to CameraNode type
//   2. Add Blender position to CAMERA_BLENDER
//   3. Add panorama image to PANORAMAS
//   4. Add texture load in PanoramaSpheres
//
// TO ADD A NEW SCREEN PLANE:
//   1. Add entry to SCREENS with Blender pos/rot/size
//   2. Add <BridgeScreen> line in Scene
//   3. Wire up interactions in BridgeInteractions.tsx
// ══════════════════════════════════════════════════════════════════════════════

function blenderPosToThree(bx: number, by: number, bz: number): THREE.Vector3 {
  return new THREE.Vector3(bx, bz, -by);
}

function blenderRotToThree(rxDeg: number, ryDeg: number, rzDeg: number): THREE.Euler {
  const rx = rxDeg * Math.PI / 180;
  const ry = ryDeg * Math.PI / 180;
  const rz = rzDeg * Math.PI / 180;
  const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'XYZ'));
  const axisSwap = new THREE.Quaternion().setFromRotationMatrix(
    new THREE.Matrix4().set(
      1,  0,  0,  0,
      0,  0,  1,  0,
      0, -1,  0,  0,
      0,  0,  0,  1
    )
  );
  q.premultiply(axisSwap);
  return new THREE.Euler().setFromQuaternion(q, 'YXZ');
}

function blenderPosToSpherePos(
  objBlender: [number, number, number],
  camBlender: [number, number, number],
  radius: number
): THREE.Vector3 {
  const obj = blenderPosToThree(...objBlender);
  const cam = blenderPosToThree(...camBlender);
  return obj.clone().sub(cam).normalize().multiplyScalar(radius);
}

function getDistanceScale(
  screenBlenderPos: [number, number, number],
  cameraNode: CameraNode
): number {
  const screen  = blenderPosToThree(...screenBlenderPos);
  const backCam = blenderPosToThree(...CAMERA_BLENDER.back);
  const thisCam = blenderPosToThree(...CAMERA_BLENDER[cameraNode]);
  return screen.distanceTo(backCam) / screen.distanceTo(thisCam);
}

// ── Camera nodes ──────────────────────────────────────────────────────────────

export type CameraNode = 'back' | 'helm' | 'radar';

const CAMERA_BLENDER: Record<CameraNode, [number, number, number]> = {
  back:  [0,       -6.9537,  4.2472 ],
  helm:  [0,       -5.0,     4.2472 ],
  radar: [2.13856, -3.49108, 4.24725],
};

const PANORAMAS: Record<CameraNode, string> = {
  back:  '/shipimages/bridge-back.webp',
  helm:  '/shipimages/bridge-helm.webp',
  radar: '/shipimages/bridge-sbradar.webp',
};

const BACK_THREE = blenderPosToThree(...CAMERA_BLENDER.back);

export const NODE_OFFSETS: Record<CameraNode, [number, number, number]> = Object.fromEntries(
  (Object.keys(CAMERA_BLENDER) as CameraNode[]).map(node => {
    const pos = blenderPosToThree(...CAMERA_BLENDER[node]).sub(BACK_THREE);
    return [node, [pos.x, pos.y, pos.z] as [number, number, number]];
  })
) as Record<CameraNode, [number, number, number]>;

const ALL_NODES = Object.keys(CAMERA_BLENDER) as CameraNode[];

// ── Screen definitions ────────────────────────────────────────────────────────

const SPHERE_RADIUS = 498;

// ── Zoom config ───────────────────────────────────────────────────────────────
const FOV_DEFAULT = 75;
const FOV_MIN     = 30;
const FOV_MAX     = 90;
const ZOOM_SPEED  = 0.05;

export interface ScreenDef {
  blenderPos:    [number, number, number];
  blenderRot:    [number, number, number];
  texture:       string;
  altTexture?:   string;   // shown when isActive = true
  blenderSize:   [number, number];
  scale?:        number;
  onClick?:      () => void;
  isActive?:     boolean;
}

export const SCREENS = {
  radarScreen: {
    blenderPos:  [2.249, -0.13147, 2.6407] as [number, number, number],
    blenderRot:  [65, 0, 0]                as [number, number, number],
    texture:     '/shipimages/radar.png',
    altTexture:  '/shipimages/radar-off.png',
    blenderSize: [1.62, 1.0]               as [number, number],
    scale:       62.25,
  },
  radarToggle: {
    blenderPos:  [2.8700, -0.35478, 2.1853] as [number, number, number], // ← adjust in Blender
    blenderRot:  [65, 0, 0]             as [number, number, number],
    texture:     '/shipimages/btn-on.png',
    altTexture:  '/shipimages/btn-off.png',
    blenderSize: [0.09, 0.09]            as [number, number],
    scale:       62.25,
  },
} satisfies Record<string, Omit<ScreenDef, 'onClick' | 'isActive'>>;

export type ScreenKey = keyof typeof SCREENS;

// ── Transition state ──────────────────────────────────────────────────────────

interface TransitionRef {
  fromNode: CameraNode;
  toNode:   CameraNode;
}

// ── Loading screen ────────────────────────────────────────────────────────────

function LoadingScreen({ onDone }: { onDone: () => void }) {
  const { progress, loaded, total } = useProgress();
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    if (progress >= 100) {
      const t = setTimeout(() => { setFadeOut(true); setTimeout(onDone, 800); }, 500);
      return () => clearTimeout(t);
    }
  }, [progress, onDone]);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #020b18 0%, #041e3a 50%, #020b18 100%)',
      opacity: fadeOut ? 0 : 1, transition: 'opacity 0.8s ease',
      pointerEvents: fadeOut ? 'none' : 'all',
    }}>
      <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>🚢</div>
      <div style={{ color: 'white', fontSize: '1.4rem', fontWeight: 'bold', letterSpacing: '0.3em', marginBottom: '0.25rem', fontFamily: 'monospace' }}>
        SHIP BRIDGE SIMULATOR
      </div>
      <div style={{ color: '#38bdf8', fontSize: '0.7rem', letterSpacing: '0.4em', marginBottom: '2.5rem', fontFamily: 'monospace' }}>
        MARITIME TRAINING SYSTEM
      </div>
      <div style={{ width: '280px', height: '4px', background: '#0a1628', borderRadius: '9999px', border: '1px solid #1e3a5f', overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${progress}%`, borderRadius: '9999px',
          background: 'linear-gradient(90deg, #1d4ed8, #38bdf8)',
          boxShadow: '0 0 12px rgba(56,189,248,0.9)', transition: 'width 0.3s ease',
        }} />
      </div>
      <div style={{ color: '#38bdf8', fontSize: '0.7rem', marginTop: '0.75rem', letterSpacing: '0.2em', fontFamily: 'monospace' }}>
        LOADING ENVIRONMENT... {Math.round(progress)}%
      </div>
      {total > 0 && (
        <div style={{ color: '#1e3a5f', fontSize: '0.6rem', marginTop: '0.25rem', letterSpacing: '0.15em', fontFamily: 'monospace' }}>
          {loaded} / {total} ASSETS
        </div>
      )}
    </div>
  );
}

// ── Camera controller ─────────────────────────────────────────────────────────

function CameraController({
  node,
  orbitRef,
}: {
  node: CameraNode;
  orbitRef: React.RefObject<OrbitControlsType>;
}) {
  const { camera } = useThree();
  const prevNode = useRef<CameraNode | null>(null);

  useEffect(() => {
    if (prevNode.current === node) return;
    prevNode.current = node;
    const controls = orbitRef.current;
    if (!controls) return;
    const lookDir = new THREE.Vector3();
    camera.getWorldDirection(lookDir);
    const [x, y, z] = NODE_OFFSETS[node];
    camera.position.set(x, y, z);
    controls.target.set(x + lookDir.x, y + lookDir.y, z + lookDir.z);
    controls.update();
  }, [node, camera, orbitRef]);

  return null;
}

// ── Zoom controller ───────────────────────────────────────────────────────────

function ZoomController() {
  const { camera, gl } = useThree();
  const targetFov = useRef(FOV_DEFAULT);

  useEffect(() => {
    const canvas = gl.domElement;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      targetFov.current = Math.max(FOV_MIN, Math.min(FOV_MAX, targetFov.current + e.deltaY * ZOOM_SPEED));
    };
    canvas.addEventListener('wheel', onWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', onWheel);
  }, [gl]);

  useFrame(() => {
    const cam = camera as THREE.PerspectiveCamera;
    if (Math.abs(cam.fov - targetFov.current) < 0.01) return;
    cam.fov += (targetFov.current - cam.fov) * 0.1;
    cam.updateProjectionMatrix();
  });

  return null;
}

// ── Panorama spheres ──────────────────────────────────────────────────────────

function PanoramaSpheres({
  node,
  transitionRef,
}: {
  node: CameraNode;
  transitionRef: React.RefObject<TransitionRef>;
}) {
  const { camera } = useThree();

  const textures: Record<CameraNode, THREE.Texture> = {
    back:  useTexture(PANORAMAS.back),
    helm:  useTexture(PANORAMAS.helm),
    radar: useTexture(PANORAMAS.radar),
  };

  const meshRefs = useRef<Record<CameraNode, THREE.Mesh | null>>(
    Object.fromEntries(ALL_NODES.map(n => [n, null])) as Record<CameraNode, THREE.Mesh | null>
  );

  useEffect(() => {
    ALL_NODES.forEach(n => {
      const tex = textures[n];
      tex.wrapS = THREE.RepeatWrapping;
      tex.repeat.x = -1;
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.needsUpdate = true;
    });
  }, []);

  useEffect(() => {
    const tr = transitionRef.current;
    if (tr.toNode === node) return;
    tr.fromNode = tr.toNode;
    tr.toNode   = node;
  }, [node]);

  useFrame(() => {
    const tr = transitionRef.current;
    ALL_NODES.forEach(n => {
      const mesh = meshRefs.current[n];
      if (!mesh) return;
      (mesh.material as THREE.MeshBasicMaterial).opacity = n === tr.toNode ? 1 : 0;
      mesh.position.copy(camera.position);
    });
  });

  return (
    <>
      {ALL_NODES.map((n, i) => (
        <mesh
          key={n}
          ref={el => { meshRefs.current[n] = el; }}
          rotation={[0, Math.PI * 0.5, 0]}
          renderOrder={i}
        >
          <sphereGeometry args={[500 - i, 60, 40]} />
          <meshBasicMaterial
            map={textures[n]}
            side={THREE.BackSide}
            transparent
            opacity={n === 'back' ? 1 : 0}
            depthWrite={false}
          />
        </mesh>
      ))}
    </>
  );
}

// ── Generic bridge screen ─────────────────────────────────────────────────────

function BridgeScreen({
  def,
  transitionRef,
  renderOrder = 10,
}: {
  def: ScreenDef;
  transitionRef: React.RefObject<TransitionRef>;
  renderOrder?: number;
}) {
  const meshRef       = useRef<THREE.Mesh>(null);
  const texture       = useTexture(def.texture);
  const altTexture    = useTexture(def.altTexture ?? def.texture);
  const scale         = def.scale ?? 62.25;
  const isHovered     = useRef(false);

  const nodeData = Object.fromEntries(
    ALL_NODES.map(node => {
      const spherePos = blenderPosToSpherePos(def.blenderPos, CAMERA_BLENDER[node], SPHERE_RADIUS);
      const [ox, oy, oz] = NODE_OFFSETS[node];
      const worldPos  = spherePos.clone().add(new THREE.Vector3(ox, oy, oz));
      const distScale = getDistanceScale(def.blenderPos, node);
      return [node, { worldPos, distScale }];
    })
  ) as Record<CameraNode, { worldPos: THREE.Vector3; distScale: number }>;

  const euler = blenderRotToThree(...def.blenderRot);

  useFrame(() => {
    if (!meshRef.current) return;
    const { worldPos, distScale } = nodeData[transitionRef.current.toNode];
    meshRef.current.position.copy(worldPos);

    // Swap texture based on isActive
    const mat = meshRef.current.material as THREE.MeshBasicMaterial;
    mat.map = def.isActive ? altTexture : texture;
    mat.needsUpdate = true;

    const w = scale * def.blenderSize[0] * distScale;
    const h = scale * def.blenderSize[1] * distScale;
    const geo     = meshRef.current.geometry as THREE.PlaneGeometry;
    const posAttr = geo.attributes.position;
    const hw = w / 2, hh = h / 2;
    posAttr.setXYZ(0, -hw,  hh, 0);
    posAttr.setXYZ(1,  hw,  hh, 0);
    posAttr.setXYZ(2, -hw, -hh, 0);
    posAttr.setXYZ(3,  hw, -hh, 0);
    posAttr.needsUpdate = true;
  });

  const init = nodeData['back'];

  return (
    <mesh
      ref={meshRef}
      position={init.worldPos.toArray()}
      rotation={euler}
      renderOrder={renderOrder}
      onClick={def.onClick}
      onPointerOver={() => {
        if (def.onClick) {
          isHovered.current = true;
          document.body.style.cursor = 'pointer';
        }
      }}
      onPointerOut={() => {
        isHovered.current = false;
        document.body.style.cursor = 'default';
      }}
    >
      <planeGeometry args={[
        scale * def.blenderSize[0] * init.distScale,
        scale * def.blenderSize[1] * init.distScale,
      ]} />
      <meshBasicMaterial
        map={texture}
        transparent
        opacity={1.0}
        side={THREE.FrontSide}
        depthWrite={false}
        depthTest={false}
      />
    </mesh>
  );
}

// ── Scene ─────────────────────────────────────────────────────────────────────

function Scene({
  cameraNode,
  screenDefs,
}: {
  cameraNode: CameraNode;
  screenDefs: Record<ScreenKey, ScreenDef>;
}) {
  const orbitRef = useRef<OrbitControlsType>(null);
  const transitionRef = useRef<TransitionRef>({ fromNode: 'back', toNode: 'back' });

  return (
    <>
      <CameraController node={cameraNode} orbitRef={orbitRef} />
      <OrbitControls
        ref={orbitRef}
        enableZoom={false}
        enablePan={false}
        rotateSpeed={-0.3}
        minPolarAngle={Math.PI * 0.2}
        maxPolarAngle={Math.PI * 0.7}
      />
      <ZoomController />
      <Suspense fallback={null}>
        <PanoramaSpheres node={cameraNode} transitionRef={transitionRef} />
        {(Object.keys(screenDefs) as ScreenKey[]).map((key, i) => (
          <BridgeScreen
            key={key}
            def={screenDefs[key]}
            transitionRef={transitionRef}
            renderOrder={20 + i}
          />
        ))}
        <Preload all />
      </Suspense>
    </>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export function BridgeScene({
  cameraNode = 'back',
  screenDefs,
}: {
  cameraNode?: CameraNode;
  screenDefs: Record<ScreenKey, ScreenDef>;
}) {
  const [loading, setLoading] = useState(true);
  const [blur, setBlur]       = useState(0);
  const prevNode              = useRef(cameraNode);

  useEffect(() => {
    if (prevNode.current === cameraNode) return;
    prevNode.current = cameraNode;
    setBlur(12);
    const t1 = setTimeout(() => setBlur(4), 150);
    const t2 = setTimeout(() => setBlur(0), 400);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [cameraNode]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: 'black' }}>
      {loading && <LoadingScreen onDone={() => setLoading(false)} />}
      <div style={{
        width: '100%', height: '100%',
        filter: `blur(${blur}px)`,
        transition: blur === 0 ? 'filter 0.3s ease-out' : 'filter 0.1s ease-in',
      }}>
        <Canvas
          style={{ width: '100%', height: '100%' }}
          camera={{ fov: FOV_DEFAULT, near: 0.1, far: 2000, position: [0, 0, 0] }}
          gl={{ antialias: true }}
          shadows={false}
        >
          <Scene cameraNode={cameraNode} screenDefs={screenDefs} />
        </Canvas>
      </div>
    </div>
  );
}