'use client';

import { useState } from 'react';
import { BridgeScene, CameraNode } from './BridgeScene';
import { useBridgeInteractions } from './BridgeInteractions';
import { BridgeNav } from './BridgeNav';
import { useBridgeAudio } from './useBridgeAudio';

export default function ShipBridgeSimulator() {
  const [cameraNode, setCameraNode] = useState<CameraNode>('back');
  const [audioEnabled, setAudioEnabled] = useState(false);
  const { screenDefs, objectDefs } = useBridgeInteractions();

  useBridgeAudio(cameraNode, audioEnabled);

  return (
    <div style={{ width: '100vw', height: '100vh', background: 'black', position: 'relative' }}>
      <BridgeScene
        cameraNode={cameraNode}
        screenDefs={screenDefs}
        objectDefs={objectDefs}
      />

      <BridgeNav current={cameraNode} onChange={setCameraNode} />

      {/* Audio toggle (top-right) */}
      <button
        onClick={() => setAudioEnabled(v => !v)}
        title={audioEnabled ? 'Mute ambience' : 'Enable ambience'}
        style={{
          position:       'absolute',
          top:            '1.25rem',
          right:          '1.25rem',
          zIndex:         100,
          display:        'flex',
          alignItems:     'center',
          gap:            '0.5rem',
          background:     audioEnabled ? 'rgba(56,189,248,0.12)' : 'rgba(2,11,24,0.82)',
          border:         audioEnabled ? '1px solid rgba(56,189,248,0.4)' : '1px solid rgba(255,255,255,0.1)',
          borderRadius:   '0.375rem',
          padding:        '0.45rem 0.85rem',
          backdropFilter: 'blur(12px)',
          color:          audioEnabled ? '#38bdf8' : '#475569',
          fontFamily:     '"IBM Plex Mono", "Courier New", monospace',
          fontSize:       '0.6rem',
          letterSpacing:  '0.2em',
          cursor:         'pointer',
          transition:     'all 0.2s ease',
          boxShadow:      audioEnabled ? '0 0 16px rgba(56,189,248,0.2)' : 'none',
          outline:        'none',
        }}
      >
        <span style={{ fontSize: '0.85rem' }}>{audioEnabled ? '🔊' : '🔇'}</span>
        {audioEnabled ? 'AMBIENCE ON' : 'AMBIENCE OFF'}
      </button>
    </div>
  );
}