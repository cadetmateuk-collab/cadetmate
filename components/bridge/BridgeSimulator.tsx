'use client';

import { useState } from 'react';
import { BridgeScene, CameraNode } from './BridgeScene';
import { useBridgeInteractions } from './BridgeInteractions';

const NAV_BUTTONS: { node: CameraNode; label: string }[] = [
  { node: 'back',  label: '⬅ BACK BRIDGE'   },
  { node: 'helm',  label: 'HELM POSITION'    },
  { node: 'radar', label: 'RADAR STATION ➡' },
];

export default function ShipBridgeSimulator() {
  const [cameraNode, setCameraNode] = useState<CameraNode>('back');
  const { screenDefs, objectDefs } = useBridgeInteractions(); // ← now destructures objectDefs too

  return (
    <div style={{ width: '100vw', height: '100vh', background: 'black' }}>
      <BridgeScene
        cameraNode={cameraNode}
        screenDefs={screenDefs}
        objectDefs={objectDefs}  // ← pass it in here
      />

      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 20,
        display: 'flex',
        gap: '12px',
      }}>
        {NAV_BUTTONS.map(({ node, label }) => (
          <button
            key={node}
            onClick={() => setCameraNode(node)}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: cameraNode === node ? '1px solid #3b82f6' : '1px solid #4b5563',
              background: cameraNode === node ? '#1d4ed8' : '#1f2937',
              color: 'white',
              fontFamily: 'monospace',
              fontSize: '12px',
              fontWeight: 'bold',
              cursor: 'pointer',
              letterSpacing: '0.1em',
            }}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}