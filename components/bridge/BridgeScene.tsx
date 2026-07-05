'use client';

import { Suspense, useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useTexture, OrbitControls, useProgress, Preload, useGLTF } from '@react-three/drei';
import type { OrbitControls as OrbitControlsType } from 'three-stdlib';
import * as THREE from 'three';
import { Water } from 'three/examples/jsm/objects/Water.js';
import { Sky }   from 'three/examples/jsm/objects/Sky.js';
import { LogbookPlaneMesh, LogbookPlaneHandle, LogEntry, ShipInfo } from './LogbookPlane';

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

export type CameraNode =
  | 'back'
  | 'helm'
  | 'psEcdis'
  | 'psLookout'
  | 'psRadio'
  | 'psSofa'
  | 'psWing'
  | 'sbDesk'
  | 'sbLogbook'
  | 'sbLookout'
  | 'radar'
  | 'sbWing';

const CAMERA_BLENDER: Record<CameraNode, [number, number, number]> = {
  back:       [0,        -6.9537,  91.568],
  helm:       [0,        -5.0,     91.568],
  psEcdis:    [-2.7145,  -3.4911,  91.568],
  psLookout:  [-14.476,   0.25729, 91.568],
  psRadio:    [-5.4819,  -3.4911,  91.568],
  psSofa:     [-11.823,  -13.676,  91.568],
  psWing:     [-30.932,  -6.9677,  91.568],
  sbDesk:     [4.7446,   -13.308,  91.568],
  sbLogbook:  [6.6436,   -3.4911,  91.568],
  sbLookout:  [4.5762,    3.5637,  91.568],
  radar:      [2.1561,   -3.4911,  91.568],
  sbWing:     [23.913,   -6.9677,  91.568],
};

const PANORAMAS: Record<CameraNode, string> = {
  back:       '/shipimages/bridge-back.webp',
  helm:       '/shipimages/bridge-helm.webp',
  psEcdis:    '/shipimages/bridge-ps-ecdis.webp',
  psLookout:  '/shipimages/bridge-ps-lookout.webp',
  psRadio:    '/shipimages/bridge-ps-radio.webp',
  psSofa:     '/shipimages/bridge-ps-sofa.webp',
  psWing:     '/shipimages/bridge-ps-wing.webp',
  sbDesk:     '/shipimages/bridge-sb-desk.webp',
  sbLogbook:  '/shipimages/bridge-sb-logbook.webp',
  sbLookout:  '/shipimages/bridge-sb-lookout.webp',
  radar:      '/shipimages/bridge-sb-radar.webp',
  sbWing:     '/shipimages/bridge-sb-wing.webp',
};

const BACK_THREE = blenderPosToThree(...CAMERA_BLENDER.back);

export const NODE_OFFSETS: Record<CameraNode, [number, number, number]> = Object.fromEntries(
  (Object.keys(CAMERA_BLENDER) as CameraNode[]).map(node => {
    const pos = blenderPosToThree(...CAMERA_BLENDER[node]).sub(BACK_THREE);
    return [node, [pos.x, pos.y, pos.z] as [number, number, number]];
  })
) as Record<CameraNode, [number, number, number]>;

const ALL_NODES  = Object.keys(CAMERA_BLENDER) as CameraNode[];
const WING_NODES = new Set<CameraNode>(['psWing', 'sbWing']);

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
  altTexture?:     string;
  videoSrc?:       string;
  loadingTexture?: string;
  blenderSize:     [number, number];
  scale?:          number;
  onClick?:        () => void;
  isActive?:       boolean;
  // 'bridge' = hidden on wing nodes. 'wing' = only on wings. 'always' = everywhere.
  visibility?:         'bridge' | 'wing' | 'always';
  // Per-node position nudge in Three.js world units [x, y, z]:
  //   x: positive = move right,  negative = move left
  //   y: positive = move up,     negative = move down
  //   z: positive = move toward camera, negative = away
  // Tune these to correct any residual parallax from each camera position.
  nodeAdjust?:         Partial<Record<CameraNode, [number, number, number]>>;
  // Momentary button: shows altTexture for pressedDurationMs on click, then reverts.
  // Wire onToggle in BridgeInteractions to respond to the press.
  momentaryPress?:     boolean;
  pressedDurationMs?:  number;
  onToggle?:           () => void;
}

export const SCREENS = {
  radarScreen: {
    blenderPos:     [2.250,  -0.13147, 89.63] as [number, number, number],
    blenderRot:     [65, 0, 0]                 as [number, number, number],
    texture:        '/shipimages/radar.png',
    altTexture:     '/shipimages/radar-off.png',
    videoSrc:       '/shipimages/radar.webm',
    loadingTexture: '/shipimages/radar-loading.png',
    blenderSize:    [1.44, 0.898]              as [number, number],
    // scale = SPHERE_RADIUS(498) / dist_from_back_camera_to_this_screen(7.449m) = 66.86
    scale:          66.86,
    visibility:     'bridge' as const,
    nodeAdjust: {
      // ── Tuned ──────────────────────────────────────────────────────
      psSofa:     [ 0,  0, 0] as [number, number, number],
      sbDesk:     [-0.4,  -0.2, 0] as [number, number, number],
      psEcdis:    [ 1,  0.2, 0] as [number, number, number],
      // ── Not yet tuned — adjust x/y/z as needed ────────────────────
      back:       [ 0,  0, 0] as [number, number, number],
      helm:       [ 0,  1.2, 0] as [number, number, number],
      psRadio:    [ 3.5,  0, 0] as [number, number, number],
      psLookout:  [ 0,  0, 0] as [number, number, number],
      sbLogbook:  [ 0,  0, 0] as [number, number, number],
      sbLookout:  [ 0,  0, 0] as [number, number, number],
      radar:      [ 0.7,  0.4, 0] as [number, number, number],
      // wings hidden via visibility:'bridge' — no need to tune
      psWing:     [ 0,  0, 0] as [number, number, number],
      sbWing:     [ 0,  0, 0] as [number, number, number],
    },
  },
  radarToggle: {
    blenderPos:          [2.870, -0.35478, 89.188] as [number, number, number],
    blenderRot:          [65, 0, 0]                as [number, number, number],
    texture:             '/shipimages/pwr-unpressed.png',
    altTexture:          '/shipimages/pwr-pressed.png',
    blenderSize:         [0.07, 0.07]              as [number, number],
    scale:               66.86,
    visibility:          'bridge' as const,
    momentaryPress:      true,
    pressedDurationMs:   1000,
    nodeAdjust: {
      // ── Tuned ──────────────────────────────────────────────────────
      psSofa:     [ -3.4,  0, 0] as [number, number, number],
      sbDesk:     [0.45,  0, 0] as [number, number, number],
      psEcdis:    [ 0.2,  0.4, 0] as [number, number, number],
      // ── Not yet tuned — adjust x/y/z as needed ────────────────────
      back:       [ 0,  0, 0] as [number, number, number],
      helm:       [ -1.8,  1.6, 0] as [number, number, number],
      psRadio:    [ 0.7,  0.1, 0] as [number, number, number],
      psLookout:  [ 0,  0, 0] as [number, number, number],
      sbLogbook:  [ 0,  0, 0] as [number, number, number],
      sbLookout:  [ 0,  0, 0] as [number, number, number],
      radar:      [ 0,  0.8, 0] as [number, number, number],
      psWing:     [ 0,  0, 0] as [number, number, number],
      sbWing:     [ 0,  0, 0] as [number, number, number],
    },
  },
  overheadPanel: {
    blenderPos:  [3.666,  5.9174, 94.52]  as [number, number, number],
    blenderRot:  [96.382, 0.56744, -0.50]      as [number, number, number],
    texture:     '/shipimages/overhead-panel.png',
    blenderSize: [9.2, 0.898]              as [number, number],
    // scale = SPHERE_RADIUS(498) / dist_from_back_camera_to_this_screen(13.692m) = 36.37
    scale:       36.9,
    visibility:  'bridge' as const,
    nodeAdjust: {
      // ── Not yet tuned — adjust x/y/z as needed ────────────────────
      back:       [ 0,  0, 0] as [number, number, number],
      helm:       [ 0,  -0.8, 0] as [number, number, number],
      psSofa:     [ 0,  0, 0] as [number, number, number],
      sbDesk:     [ 0,  0, 0] as [number, number, number],
      psEcdis:    [ 0,  0, 0] as [number, number, number],
      psRadio:    [ 0,  0, 0] as [number, number, number],
      psLookout:  [ 0,  0, 0] as [number, number, number],
      sbLogbook:  [ 0,  0, 0] as [number, number, number],
      sbLookout:  [ 0,  0, 0] as [number, number, number],
      radar:      [ 0,  0, 0] as [number, number, number],
      psWing:     [ 0,  0, 0] as [number, number, number],
      sbWing:     [ 0,  0, 0] as [number, number, number],
    },
  },
  logbookPlane: {
    blenderPos:  [6.9, -1.3, 89.4]  as [number, number, number],
    blenderRot:  [75, 0, 0]          as [number, number, number],
    texture:     '/shipimages/logbook-blank.png',   // plain fallback; overridden by canvas texture
    blenderSize: [0.55, 0.38]        as [number, number],
    scale:       95,                 // 498 / dist_back_to_logbook — tune in-engine
    visibility:  'bridge'            as const,
    nodeAdjust: {
      back: [0,0,0], helm: [0,0,0], psSofa: [0,0,0], sbDesk: [0,0,0],
      psEcdis: [0,0,0], psRadio: [0,0,0], psLookout: [0,0,0],
      sbLogbook: [0,0,0],   // ← tune this one first; it's the close-up node
      sbLookout: [0,0,0], radar: [0,0,0], psWing: [0,0,0], sbWing: [0,0,0],
    },
  },
  // ── Add new screen planes here ─────────────────────────────────────────────
  // For scale: open browser console and run:
  //   498 / distanceTo(blenderPosToThree(...screenPos), blenderPosToThree(...backCamPos))
  // Or just set scale:1 first, eyeball it, then multiply up.
  // myScreen: {
  //   blenderPos:  [x, y, z],
  //   blenderRot:  [rx, ry, rz],
  //   texture:     '/shipimages/myscreen.png',
  //   blenderSize: [w, h],   // real Blender metres
  //   scale:       66.86,    // SPHERE_RADIUS / dist_from_back_to_screen
  //   visibility:  'bridge',
  //   nodeAdjust: {
  //     back:      [0, 0, 0],  // x=right/left  y=up/down  z=toward/away
  //     helm:      [0, 0, 0],
  //     psSofa:    [0, 0, 0],
  //     sbDesk:    [0, 0, 0],
  //     psEcdis:   [0, 0, 0],
  //     psRadio:   [0, 0, 0],
  //     psLookout: [0, 0, 0],
  //     sbLogbook: [0, 0, 0],
  //     sbLookout: [0, 0, 0],
  //     radar:     [0, 0, 0],
  //     psWing:    [0, 0, 0],
  //     sbWing:    [0, 0, 0],
  //   },
  // },
} satisfies Record<string, Omit<ScreenDef, 'onClick' | 'isActive' | 'onToggle'>>;

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
    // Main camera must see layer 31 (panorama spheres) as well as default layer 0
    camera.layers.enable(31);
  }, [camera]);

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
    back:      useTexture(PANORAMAS.back),
    helm:      useTexture(PANORAMAS.helm),
    psEcdis:   useTexture(PANORAMAS.psEcdis),
    psLookout: useTexture(PANORAMAS.psLookout),
    psRadio:   useTexture(PANORAMAS.psRadio),
    psSofa:    useTexture(PANORAMAS.psSofa),
    psWing:    useTexture(PANORAMAS.psWing),
    sbDesk:    useTexture(PANORAMAS.sbDesk),
    sbLogbook: useTexture(PANORAMAS.sbLogbook),
    sbLookout: useTexture(PANORAMAS.sbLookout),
    radar:     useTexture(PANORAMAS.radar),
    sbWing:    useTexture(PANORAMAS.sbWing),
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
          ref={el => {
            meshRefs.current[n] = el;
            // Layer 31 = panorama-only layer. The Water mirror camera renders
            // layer 0 by default, so it never sees the panorama spheres.
            // This prevents the sphere (which tracks camera.position every frame)
            // from appearing in the reflection and causing jitter.
            el?.layers.set(31);
          }}
          rotation={[0, Math.PI * 0.5, 0]}
          renderOrder={100 + i}
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
    const currentNode = transitionRef.current.toNode;

    const vis    = def.visibility ?? 'bridge';
    const onWing = WING_NODES.has(currentNode);
    meshRef.current.visible = !(vis === 'bridge' && onWing);
    if (!meshRef.current.visible) return;

    const { worldPos, distScale } = nodeData[currentNode];
    const [ax, ay, az] = def.nodeAdjust?.[currentNode] ?? [0, 0, 0];
    meshRef.current.position.set(worldPos.x + ax, worldPos.y + ay, worldPos.z + az);

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
  const texture    = useTexture(def.texture,                   (t) => {
    if (!def.momentaryPress) return;
    const tex = Array.isArray(t) ? t[0] : t;
    tex.premultiplyAlpha = true;
    tex.needsUpdate = true;
  });
  const altTexture = useTexture(def.altTexture ?? def.texture, (t) => {
    if (!def.momentaryPress) return;
    const tex = Array.isArray(t) ? t[0] : t;
    tex.premultiplyAlpha = true;
    tex.needsUpdate = true;
  });
  const scale      = def.scale ?? 62.25;

  // Momentary press state
  const [isPressed, setIsPressed]   = useState(false);
  const pressTimerRef               = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Refs so useFrame always reads latest values without stale closure
  const isActiveRef  = useRef(def.isActive);
  const isPressedRef = useRef(isPressed);
  const onClickRef   = useRef(def.onClick);
  const onToggleRef  = useRef(def.onToggle);
  useEffect(() => { isActiveRef.current  = def.isActive; },  [def.isActive]);
  useEffect(() => { isPressedRef.current = isPressed; },     [isPressed]);
  useEffect(() => { onClickRef.current   = def.onClick; },   [def.onClick]);
  useEffect(() => { onToggleRef.current  = def.onToggle; },  [def.onToggle]);

  useEffect(() => () => { if (pressTimerRef.current) clearTimeout(pressTimerRef.current); }, []);

  const handleClick = useCallback(() => {
    if (def.momentaryPress) {
      setIsPressed(true);
      onToggleRef.current?.();
      pressTimerRef.current = setTimeout(() => setIsPressed(false), def.pressedDurationMs ?? 1000);
    } else {
      onClickRef.current?.();
    }
  }, [def.momentaryPress, def.pressedDurationMs]);

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
    const currentNode = transitionRef.current.toNode;

    const vis    = def.visibility ?? 'bridge';
    const onWing = WING_NODES.has(currentNode);
    meshRef.current.visible = !(vis === 'bridge' && onWing);
    if (!meshRef.current.visible) return;

    const { worldPos, distScale } = nodeData[currentNode];
    const [ax, ay, az] = def.nodeAdjust?.[currentNode] ?? [0, 0, 0];
    meshRef.current.position.set(worldPos.x + ax, worldPos.y + ay, worldPos.z + az);

    const mat = meshRef.current.material as THREE.MeshBasicMaterial;
    const nextMap = def.momentaryPress
      ? (isPressedRef.current ? altTexture : texture)
      : (isActiveRef.current ? altTexture : texture);
    if (mat.map !== nextMap) {
      mat.map = null;
      mat.needsUpdate = true;
      mat.map = nextMap;
      mat.needsUpdate = true;
    }

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
      onClick={handleClick}
      onPointerOver={() => { if (def.onClick || def.momentaryPress) document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { document.body.style.cursor = 'default'; }}
    >
      <planeGeometry args={[
        scale * def.blenderSize[0] * init.distScale,
        scale * def.blenderSize[1] * init.distScale,
      ]} />
      <meshBasicMaterial
        map={texture}
        transparent
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
  const tz = 0;
  return new THREE.Vector3(tx, ty, tz);
}, [def.blenderPos]);

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

// ══════════════════════════════════════════════════════════════════════════════
// ── ENVIRONMENT CONFIG — edit these to change sky, sun & water appearance ─────
// ══════════════════════════════════════════════════════════════════════════════
export const ENV = {
  sky: {
    // Sun position — spherical coords. elevation: 0=horizon, 90=overhead.
    // azimuth: compass bearing in degrees (0=north, 90=east, 180=south etc.)
    sunElevationDeg:  78,    // higher = brighter midday sky, lower = golden hour / dusk
    sunAzimuthDeg:    210,   // direction the sun is coming from

    // Sky atmosphere tweaks (three.js Sky shader uniforms)
    turbidity:        8,     // 1=crystal clear, 20=very hazy/dusty
    rayleigh:         1.2,   // 0=black sky, 3=deep blue, 6+ = orange/red sunset
    mieCoefficient:   0.001, // sun halo size — higher = larger glow around sun
    mieDirectionalG:  0.9,   // sun halo sharpness — 0=diffuse, 0.99=tight pinpoint
  },
  water: {
    color:          0x31a4de, // base deep-water colour (hex)
    sunColor:       0xb5e6ff, // colour of sun glint on water
    distortionScale: 3.7,     // wave choppiness (overridden by waveHeight prop)
    // WATER_Y: how far below camera the plane sits. More negative = lower horizon.
    y:              -80,
  },
};
// ══════════════════════════════════════════════════════════════════════════════

// ── Sky + Sun ─────────────────────────────────────────────────────────────────
function SkyAndSun({ onSunReady }: { onSunReady: (sun: THREE.Vector3) => void }) {
  const { scene, gl } = useThree();
  useEffect(() => {
    const sky = new Sky();
    sky.scale.setScalar(450);
    scene.add(sky);
    const sun = new THREE.Vector3();
    sun.setFromSphericalCoords(
      1,
      THREE.MathUtils.degToRad(ENV.sky.sunElevationDeg),
      THREE.MathUtils.degToRad(ENV.sky.sunAzimuthDeg),
    );
    const u = sky.material.uniforms;
    u['sunPosition'].value.copy(sun);
    u['turbidity'].value       = ENV.sky.turbidity;
    u['rayleigh'].value        = ENV.sky.rayleigh;
    u['mieCoefficient'].value  = ENV.sky.mieCoefficient;
    u['mieDirectionalG'].value = ENV.sky.mieDirectionalG;
    const pmrem = new THREE.PMREMGenerator(gl);
    scene.environment = pmrem.fromScene(sky as unknown as THREE.Scene).texture;
    pmrem.dispose();
    onSunReady(sun);
    return () => { scene.remove(sky); sky.geometry.dispose(); (sky.material as THREE.Material).dispose(); };
  }, []);
  return null;
}

// ── Ocean — three.js Water shader with reflections ────────────────────────────
const WATER_Y = ENV.water.y;

function OceanPlane({ speedKnots = 8, waveHeight = 1.2, waveAngleDeg = 0, sunPosition }: {
  speedKnots?:   number;
  waveHeight?:   number;
  waveAngleDeg?: number;
  sunPosition?:  THREE.Vector3;
}) {
  const { scene } = useThree();
  const waterRef  = useRef<Water | null>(null);

  useEffect(() => {
    const geo     = new THREE.PlaneGeometry(20000, 20000);
    const normals = new THREE.TextureLoader().load(
      'https://threejs.org/examples/textures/waternormals.jpg',
      (t) => { t.wrapS = t.wrapT = THREE.RepeatWrapping; }
    );
    const water = new Water(geo, {
      textureWidth:    512,
      textureHeight:   512,
      waterNormals:    normals,
      sunDirection:    sunPosition?.clone().normalize() ?? new THREE.Vector3(0.70707, 0.70707, 0),
      sunColor:        ENV.water.sunColor,
      waterColor:      ENV.water.color,
      distortionScale: ENV.water.distortionScale,
      clipBias:        0.1,
      fog:             false,
    });
    const rad = THREE.MathUtils.degToRad(waveAngleDeg);
    water.rotation.x = -Math.PI / 2;
    water.rotation.z = rad;
    water.position.y = WATER_Y;
    water.renderOrder = 0;
    (water.material as THREE.ShaderMaterial).depthWrite = false;
    waterRef.current = water;
    scene.add(water);
    return () => {
      scene.remove(water);
      geo.dispose();
      (water.material as THREE.Material).dispose();
    };
  }, []);

  useEffect(() => {
    if (waterRef.current)
      waterRef.current.material.uniforms['distortionScale'].value = Math.max(0.5, waveHeight * 3.7);
  }, [waveHeight]);

  useEffect(() => {
    const w = waterRef.current;
    if (!w) return;
    w.rotation.z = THREE.MathUtils.degToRad(waveAngleDeg);
  }, [waveAngleDeg]);

  useEffect(() => {
    if (waterRef.current && sunPosition)
      waterRef.current.material.uniforms['sunDirection'].value.copy(sunPosition).normalize();
  }, [sunPosition]);

  useFrame((_, delta) => {
    const w = waterRef.current;
    if (!w) return;
    w.material.uniforms['time'].value += delta * (0.5 + speedKnots * 0.05);
  });

  return null;
}

// ── Scene ─────────────────────────────────────────────────────────────────────

function Scene({
  cameraNode,
  screenDefs,
  objectDefs = {},
  speedKnots,
  waveHeight,
  waveAngleDeg,
}: {
  cameraNode:    CameraNode;
  screenDefs:    Record<ScreenKey, ScreenDef>;
  objectDefs?:   Record<string, ObjectDef>;
  speedKnots?:   number;
  waveHeight?:   number;
  waveAngleDeg?: number;
}) {
  const orbitRef      = useRef<OrbitControlsType>(null);
  const transitionRef = useRef<TransitionRef>({ fromNode: 'back', toNode: 'back' });
  const [sunPos, setSunPos] = useState<THREE.Vector3 | undefined>(undefined);

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
        <SkyAndSun onSunReady={setSunPos} />
        <OceanPlane speedKnots={speedKnots} waveHeight={waveHeight} waveAngleDeg={waveAngleDeg} sunPosition={sunPos} />

        <PanoramaSpheres node={cameraNode} transitionRef={transitionRef} />

        {/* Screen planes */}
        {(Object.keys(screenDefs) as ScreenKey[]).map((key, i) => {
          const d = screenDefs[key];
          return d.videoSrc ? (
            <RadarVideoScreen
              key={key}
              def={d}
              transitionRef={transitionRef}
              renderOrder={120 + i}
            />
          ) : (
            <BridgeScreen
              key={key}
              def={d}
              transitionRef={transitionRef}
              renderOrder={120 + i}
            />
          );
        })}

        {/* 3D objects */}
        {Object.keys(objectDefs).map((key, i) => (
          <BridgeObject
            key={key}
            def={objectDefs[key]}
            renderOrder={150 + i}
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
  speedKnots,
  waveHeight,
  waveAngleDeg,
}: {
  cameraNode?:   CameraNode;
  screenDefs:    Record<ScreenKey, ScreenDef>;
  objectDefs?:   Record<string, ObjectDef>;
  speedKnots?:   number;
  waveHeight?:   number;
  waveAngleDeg?: number;
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
          camera={{ fov: FOV_DEFAULT, near: 0.1, far: 5000, position: [0, 0, 0] }}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
          shadows={false}
        >
          <Scene cameraNode={cameraNode} screenDefs={screenDefs} objectDefs={objectDefs} speedKnots={speedKnots} waveHeight={waveHeight} waveAngleDeg={waveAngleDeg} />
        </Canvas>
      </div>
    </div>
  );
}