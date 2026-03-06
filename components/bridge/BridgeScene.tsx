'use client';

import { Suspense, useEffect, useRef, useState, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useTexture, OrbitControls, useProgress, Preload, useGLTF } from '@react-three/drei';
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
//   2. Wire in BridgeInteractions.tsx
//
// TO ADD A NEW 3D OBJECT:
//   1. Add entry to OBJECTS with Blender pos/rot/scale and modelPath
//   2. Wire in BridgeInteractions.tsx
// ══════════════════════════════════════════════════════════════════════════════

// ── Coordinate converters ─────────────────────────────────────────────────────

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

// ══════════════════════════════════════════════════════════════════════════════
// ── CAMERA NODES ─────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

export type CameraNode = 'back' | 'helm' | 'radar';

const CAMERA_BLENDER: Record<CameraNode, [number, number, number]> = {
  back:  [0,        -6.9537,  4.2472 ],
  helm:  [0,        -5.0,     4.2472 ],
  radar: [2.13856,  -3.49108, 4.24725],
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

// ── Constants ─────────────────────────────────────────────────────────────────

const SPHERE_RADIUS = 498;
const FOV_DEFAULT   = 75;
const FOV_MIN       = 30;
const FOV_MAX       = 90;
const ZOOM_SPEED    = 0.05;

// ══════════════════════════════════════════════════════════════════════════════
// ── SCREEN PLANES — 2D planes projected onto panorama sphere ─────────────────
// ══════════════════════════════════════════════════════════════════════════════

export interface ScreenDef {
  blenderPos:      [number, number, number];
  blenderRot:      [number, number, number];
  texture:         string;
  altTexture?:     string;    // shown when isActive = true
  videoSrc?:       string;    // WebM video shown when isActive = true
  loadingTexture?: string;    // shown during boot-up sequence before video
  blenderSize:     [number, number];
  scale?:          number;
  onClick?:        () => void;
  isActive?:       boolean;
}

export const SCREENS = {
  radarScreen: {
    blenderPos:      [2.233,   -0.13147, 2.6350] as [number, number, number],
    blenderRot:      [65, 0, 0]                  as [number, number, number],
    texture:         '/shipimages/radar.png',
    altTexture:      '/shipimages/radar-off.png',
    videoSrc:        '/shipimages/radar.webm',
    loadingTexture:  '/shipimages/radar-loading.png',
    blenderSize:     [1.58, 1.0]                 as [number, number],
    scale:           62.25,
  },
  radarToggle: {
    blenderPos:  [2.855, -0.35478, 2.19] as [number, number, number],
    blenderRot:  [65, 0, 0]                 as [number, number, number],
    texture:     '/shipimages/btn-on.png',
    altTexture:  '/shipimages/btn-off.png',
    blenderSize: [0.07, 0.07]               as [number, number],
    scale:       62.25,
  },
  // ── Add new screen planes here ─────────────────────────────────────────────
  // compassScreen: {
  //   blenderPos:  [x, y, z],
  //   blenderRot:  [rx, ry, rz],
  //   texture:     '/shipimages/compass.png',
  //   blenderSize: [1.0, 1.0],
  //   scale:       62.25,
  // },
} satisfies Record<string, Omit<ScreenDef, 'onClick' | 'isActive'>>;

export type ScreenKey = keyof typeof SCREENS;

// ══════════════════════════════════════════════════════════════════════════════
// ── 3D OBJECTS — real world space, viewed from different angles per node ──────
// ══════════════════════════════════════════════════════════════════════════════

export interface ObjectDef {
  blenderPos:   [number, number, number];
  blenderRot:   [number, number, number];
  blenderScale: [number, number, number];
  modelPath:    string;
  onClick?:     () => void;
  isActive?:    boolean;
}

export const OBJECTS = {
  throttle: {
    // Blender position — converted to Three.js world space automatically
    blenderPos:   [-0.36919, -3.1421, 2.1046] as [number, number, number],
    blenderRot:   [0, 0, 0]                   as [number, number, number],
    blenderScale: [1, 1, 1]                   as [number, number, number],
    modelPath:    '/models/throttle.glb',
  },
  // ── Add new 3D objects here ────────────────────────────────────────────────
  // wheel: {
  //   blenderPos:   [x, y, z],
  //   blenderRot:   [rx, ry, rz],
  //   blenderScale: [1, 1, 1],
  //   modelPath:    '/models/wheel.glb',
  // },
} satisfies Record<string, Omit<ObjectDef, 'onClick' | 'isActive'>>;

export type ObjectKey = keyof typeof OBJECTS;

// ── Transition state ──────────────────────────────────────────────────────────

interface TransitionRef {
  fromNode: CameraNode;
  toNode:   CameraNode;
}

// ── Loading screen ────────────────────────────────────────────────────────────

function LoadingScreen({ onDone }: { onDone: () => void }) {
  const { progress, loaded, total } = useProgress();
  const [fadeOut, setFadeOut] = useState(false);
  const roundedProgress = Math.round(progress); // ← single source of truth

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
          height: '100%',
          width: `${roundedProgress}%`, // ← use rounded value
          borderRadius: '9999px',
          background: 'linear-gradient(90deg, #1d4ed8, #38bdf8)',
          boxShadow: '0 0 12px rgba(56,189,248,0.9)',
          transition: 'width 0.3s ease',
        }} />
      </div>
      <div style={{ color: '#38bdf8', fontSize: '0.7rem', marginTop: '0.75rem', letterSpacing: '0.2em', fontFamily: 'monospace' }}>
        LOADING ENVIRONMENT... {roundedProgress}% {/* ← use rounded value */}
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

// ── Radar boot sequence state machine ────────────────────────────────────────
//
//  Radar display states when isActive toggles:
//    OFF  → turn on  → 'black' (1 s) → 'loading' (2 s) → 'video' (loop)
//    ON   → turn off → 'black' immediately
//
type RadarDisplayState = 'off' | 'black' | 'loading' | 'video';

function RadarVideoScreen({
  def,
  transitionRef,
  renderOrder = 20,
}: {
  def: ScreenDef;
  transitionRef: React.RefObject<TransitionRef>;
  renderOrder?: number;
}) {
  const meshRef        = useRef<THREE.Mesh>(null);
  const offTexture     = useTexture(def.altTexture ?? def.texture);
  const loadingTexture = useTexture(def.loadingTexture ?? def.texture);
  const scale          = def.scale ?? 62.25;

  // ── video element + VideoTexture ──────────────────────────────────────────
  const videoRef     = useRef<HTMLVideoElement | null>(null);
  const videoTexture = useRef<THREE.VideoTexture | null>(null);

  useEffect(() => {
    const vid = document.createElement('video');
    vid.src    = def.videoSrc!;
    vid.loop   = true;
    vid.muted  = true;
    vid.playsInline = true;
    vid.preload = 'auto';
    videoRef.current = vid;

    const vt = new THREE.VideoTexture(vid);
    vt.colorSpace = THREE.SRGBColorSpace;
    videoTexture.current = vt;

    return () => {
      vid.pause();
      vid.src = '';
      vt.dispose();
    };
  }, [def.videoSrc]);

  // ── display state machine ──────────────────────────────────────────────────
  const [displayState, setDisplayState] = useState<RadarDisplayState>('off');
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  };

  const isActiveRef = useRef(def.isActive);
  useEffect(() => {
    const wasActive = isActiveRef.current;
    isActiveRef.current = def.isActive;

    if (def.isActive && !wasActive) {
      // Turning ON: black → loading → video
      clearTimers();
      videoRef.current?.pause();
      setDisplayState('black');

      const t1 = setTimeout(() => {
        setDisplayState('loading');
        const t2 = setTimeout(() => {
          setDisplayState('video');
          videoRef.current?.play().catch(() => {});
        }, 4000);
        timersRef.current.push(t2);
      }, 1000);
      timersRef.current.push(t1);

    } else if (!def.isActive && wasActive) {
      // Turning OFF: immediate black
      clearTimers();
      videoRef.current?.pause();
      setDisplayState('off');
    }

    return clearTimers;
  }, [def.isActive]);

  // ── click / interaction refs ───────────────────────────────────────────────
  const onClickRef = useRef(def.onClick);
  useEffect(() => { onClickRef.current = def.onClick; }, [def.onClick]);

  // ── node position data ─────────────────────────────────────────────────────
  const nodeData = useMemo(() => Object.fromEntries(
    ALL_NODES.map(node => {
      const spherePos = blenderPosToSpherePos(def.blenderPos, CAMERA_BLENDER[node], SPHERE_RADIUS);
      const [ox, oy, oz] = NODE_OFFSETS[node];
      const worldPos  = spherePos.clone().add(new THREE.Vector3(ox, oy, oz));
      const distScale = getDistanceScale(def.blenderPos, node);
      return [node, { worldPos, distScale }];
    })
  ) as Record<CameraNode, { worldPos: THREE.Vector3; distScale: number }>, []);

  const euler     = useMemo(() => blenderRotToThree(...def.blenderRot), []);
  const stateRef  = useRef(displayState);
  useEffect(() => { stateRef.current = displayState; }, [displayState]);

  useFrame(() => {
    if (!meshRef.current) return;
    const { worldPos, distScale } = nodeData[transitionRef.current.toNode];
    meshRef.current.position.copy(worldPos);

    const mat = meshRef.current.material as THREE.MeshBasicMaterial;
    switch (stateRef.current) {
      case 'video':
        mat.map = videoTexture.current;
        mat.color.set(0xffffff);
        break;
      case 'loading':
        mat.map = loadingTexture;
        mat.color.set(0xffffff);
        break;
      case 'black':
      case 'off':
        mat.map = null;
        mat.color.set(0x000000);
        break;
    }
    mat.needsUpdate = true;

    const w      = scale * def.blenderSize[0] * distScale;
    const h      = scale * def.blenderSize[1] * distScale;
    const geo    = meshRef.current.geometry as THREE.PlaneGeometry;
    const pos    = geo.attributes.position;
    const hw = w / 2, hh = h / 2;
    pos.setXYZ(0, -hw,  hh, 0);
    pos.setXYZ(1,  hw,  hh, 0);
    pos.setXYZ(2, -hw, -hh, 0);
    pos.setXYZ(3,  hw, -hh, 0);
    pos.needsUpdate = true;
  });

  const init = nodeData['back'];

  return (
    <mesh
      ref={meshRef}
      position={init.worldPos.toArray()}
      rotation={euler}
      renderOrder={renderOrder}
      onClick={() => onClickRef.current?.()}
      onPointerOver={() => { if (def.onClick) document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { document.body.style.cursor = 'default'; }}
    >
      <planeGeometry args={[
        scale * def.blenderSize[0] * init.distScale,
        scale * def.blenderSize[1] * init.distScale,
      ]} />
      <meshBasicMaterial
        transparent
        opacity={1.0}
        side={THREE.FrontSide}
        depthWrite={false}
        depthTest={false}
      />
    </mesh>
  );
}

// ── Screen plane — projected onto panorama sphere ─────────────────────────────

function BridgeScreen({
  def,
  transitionRef,
  renderOrder = 20,
}: {
  def: ScreenDef;
  transitionRef: React.RefObject<TransitionRef>;
  renderOrder?: number;
}) {
  const meshRef    = useRef<THREE.Mesh>(null);
  const texture    = useTexture(def.texture);
  const altTexture = useTexture(def.altTexture ?? def.texture);
  const scale      = def.scale ?? 62.25;

  // Refs so useFrame always reads latest values without stale closure
  const isActiveRef = useRef(def.isActive);
  const onClickRef  = useRef(def.onClick);
  useEffect(() => { isActiveRef.current = def.isActive; }, [def.isActive]);
  useEffect(() => { onClickRef.current  = def.onClick;  }, [def.onClick]);

  // Pre-compute world position + scale for every node
  const nodeData = useMemo(() => Object.fromEntries(
    ALL_NODES.map(node => {
      const spherePos = blenderPosToSpherePos(def.blenderPos, CAMERA_BLENDER[node], SPHERE_RADIUS);
      const [ox, oy, oz] = NODE_OFFSETS[node];
      const worldPos  = spherePos.clone().add(new THREE.Vector3(ox, oy, oz));
      const distScale = getDistanceScale(def.blenderPos, node);
      return [node, { worldPos, distScale }];
    })
  ) as Record<CameraNode, { worldPos: THREE.Vector3; distScale: number }>, []);

  const euler = useMemo(() => blenderRotToThree(...def.blenderRot), []);

  useFrame(() => {
    if (!meshRef.current) return;
    const { worldPos, distScale } = nodeData[transitionRef.current.toNode];

    meshRef.current.position.copy(worldPos);

    // Swap texture based on isActive
    const mat = meshRef.current.material as THREE.MeshBasicMaterial;
    mat.map = isActiveRef.current ? altTexture : texture;
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
      onClick={() => onClickRef.current?.()}
      onPointerOver={() => { if (def.onClick) document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { document.body.style.cursor = 'default'; }}
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

// ── 3D Object — real world space, seen from different angles per node ─────────

function BridgeObject({
  def,
  renderOrder = 50,
}: {
  def: ObjectDef;
  renderOrder?: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF(def.modelPath);

  // Convert Blender world position to Three.js world space
  // Subtract BACK_THREE so back node is the origin, matching NODE_OFFSETS
const worldPos = useMemo(() => {
  const tx = def.blenderPos[0] - CAMERA_BLENDER.back[0];
  const ty = 0;
  const tz = 0; // ← start at zero so we can see it
  console.log('Throttle Three.js position:', tx, ty, tz);
  return new THREE.Vector3(tx, ty, tz);
}, []);

  const euler = useMemo(() => blenderRotToThree(...def.blenderRot), []);
  const [sx, sy, sz] = def.blenderScale;

  // Refs for latest interaction state
  const onClickRef  = useRef(def.onClick);
  useEffect(() => { onClickRef.current = def.onClick; }, [def.onClick]);

  // Clone scene so multiple instances don't share materials
  const clonedScene = useMemo(() => scene.clone(), [scene]);

  useEffect(() => {
    clonedScene.traverse(child => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.renderOrder = renderOrder;
        (mesh.material as THREE.Material).depthWrite = true;
        (mesh.material as THREE.Material).depthTest  = true;
      }
    });
  }, [clonedScene, renderOrder]);

  return (
    <group
      ref={groupRef}
      position={[worldPos.x, worldPos.y, worldPos.z]}
      rotation={euler}
      scale={[10, 10, 10]}  // ← temp, remove once found
      onClick={() => onClickRef.current?.()}
      onPointerOver={() => { if (def.onClick) document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { document.body.style.cursor = 'default'; }}
    >
      <primitive object={clonedScene} />
    </group>
  );
}

// ── Ocean sphere — lives inside Three.js, perfectly synced with camera ───────
//  Rendered behind everything (renderOrder -1). Follows camera.position each
//  frame exactly like the panorama spheres do, so panning always matches.
//  The gentle bob/roll is applied as a slow rotation offset on the mesh itself.

function OceanSphere() {
  const { camera } = useThree();
  const meshRef    = useRef<THREE.Mesh>(null);
  const texture    = useTexture('/shipimages/ocean.webp');
  const clock      = useRef(0);

  useEffect(() => {
    texture.wrapS     = THREE.RepeatWrapping;
    texture.wrapT     = THREE.RepeatWrapping;
    texture.repeat.x  = -1;               // flip so it reads left→right naturally
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
  }, [texture]);

  useFrame((_, delta) => {
    if (!meshRef.current) return;

    // Follow camera so the sphere is always centred on the viewer
    meshRef.current.position.copy(camera.position);

    // Gentle calm-sea rocking: tiny roll + slight vertical pitch oscillation
    clock.current += delta;
    const t = clock.current;
    meshRef.current.rotation.z = Math.sin(t / 5.5)  * 0.0026;   // roll  ±0.15°
    meshRef.current.rotation.x = Math.sin(t / 11.0) * 0.0017;   // pitch bob
  });

  return (
    <mesh
      ref={meshRef}
      // Rotate so the image "forward" aligns with camera default look direction
      rotation={[
        -0.42,          // tilt up — lifts horizon into view
        Math.PI * 0.5,  // match panorama sphere orientation
        0,
      ]}
      renderOrder={-1}
    >
      <sphereGeometry args={[501, 60, 40]} />
      <meshBasicMaterial
        map={texture}
        side={THREE.BackSide}
        depthWrite={false}
      />
    </mesh>
  );
}

// ── Scene ─────────────────────────────────────────────────────────────────────

function Scene({
  cameraNode,
  screenDefs,
  objectDefs = {},
}: {
  cameraNode:   CameraNode;
  screenDefs:   Record<ScreenKey, ScreenDef>;
  objectDefs?:  Record<string, ObjectDef>;
}) {
  const orbitRef      = useRef<OrbitControlsType>(null);
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
        maxPolarAngle={Math.PI * 0.6}
      />
      <ZoomController />
      <Suspense fallback={null}>
        {/* Ocean sphere — behind everything, perfectly camera-synced */}
        <OceanSphere />

        <PanoramaSpheres node={cameraNode} transitionRef={transitionRef} />

        {/* Screen planes */}
        {(Object.keys(screenDefs) as ScreenKey[]).map((key, i) => {
          const d = screenDefs[key];
          return d.videoSrc ? (
            <RadarVideoScreen
              key={key}
              def={d}
              transitionRef={transitionRef}
              renderOrder={20 + i}
            />
          ) : (
            <BridgeScreen
              key={key}
              def={d}
              transitionRef={transitionRef}
              renderOrder={20 + i}
            />
          );
        })}

        {/* 3D objects */}
        {Object.keys(objectDefs).map((key, i) => (
          <BridgeObject
            key={key}
            def={objectDefs[key]}
            renderOrder={50 + i}
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
  objectDefs = {},
}: {
  cameraNode?:  CameraNode;
  screenDefs:   Record<ScreenKey, ScreenDef>;
  objectDefs?:  Record<string, ObjectDef>;
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
    <div style={{ width: '100%', height: '100%', position: 'relative', background: 'black', overflow: 'hidden' }}>
      {loading && <LoadingScreen onDone={() => setLoading(false)} />}

      <div style={{
        position: 'absolute',
        inset: 0,
        zIndex: 1,
        background: 'transparent',
        filter: `blur(${blur}px)`,
        transition: blur === 0 ? 'filter 0.3s ease-out' : 'filter 0.1s ease-in',
      }}>
        <Canvas
          style={{ width: '100%', height: '100%', background: 'black' }}
          camera={{ fov: FOV_DEFAULT, near: 0.1, far: 2000, position: [0, 0, 0] }}
          gl={{ antialias: true, alpha: false }}
          shadows={false}
        >
          <Scene cameraNode={cameraNode} screenDefs={screenDefs} objectDefs={objectDefs} />
        </Canvas>
      </div>
    </div>
  );
}