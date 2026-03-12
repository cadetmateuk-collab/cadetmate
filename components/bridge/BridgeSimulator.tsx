'use client';

import { useRef, useState, useCallback } from 'react';
import { BridgeScene, CameraNode } from './BridgeScene';
import { useBridgeInteractions } from './BridgeInteractions';
import { BridgeNav } from './BridgeNav';
import { useBridgeAudio } from './useBridgeAudio';
import { RadioArm } from './RadioArm';
import { PhoneArm, PhoneArmHandle } from './PhoneArm';
import { useArmSway } from './useArmSway';
import { useSessionReporter } from '@/lib/useSessionReporter';

const DEBUG_OVERLAYS = false;

export default function ShipBridgeSimulator() {
  const [cameraNode, setCameraNode] = useState<CameraNode>('back');
  const [audioEnabled, setAudioEnabled] = useState(false);
  const { screenDefs, objectDefs } = useBridgeInteractions();

  const phoneArmRef = useRef<PhoneArmHandle | null>(null);
  const armSway     = useArmSway();
  const { ringPhone, stopRing } = useBridgeAudio(cameraNode, audioEnabled);

  // ── Session reporting ──────────────────────────────────────────────────────
  // reportPhoneIncoming is extracted first via a ref so it can be called inside
  // onIncomingCall without a circular dependency
  const reportPhoneIncomingRef = useRef<(from: string) => void>(() => {});

  const {
    reportCameraMove,
    reportPTT,
    reportPhoneRaised,
    reportPhoneDialled,
    reportPhoneOutgoing,
    reportPhoneAnswered,
    reportPhoneEnded,
    reportPhoneMissed,
    reportPhoneIncoming,
  } = useSessionReporter({
    onIncomingCall: (from) => {
      phoneArmRef.current?.triggerIncoming(from);
      reportPhoneIncomingRef.current(from);
      ringPhone();
    },
    onScenario: (scenario, message) => {
      console.log('[SCENARIO]', scenario, message);
    },
  });

  // Keep the ref in sync so onIncomingCall always calls the live function
  reportPhoneIncomingRef.current = reportPhoneIncoming;

  // ── Camera ─────────────────────────────────────────────────────────────────
  const handleCameraChange = useCallback((node: CameraNode) => {
    setCameraNode(node);
    reportCameraMove(node);
  }, [reportCameraMove]);

  return (
    <div style={{ width: '100vw', height: '100vh', background: 'black', position: 'relative' }}>
      <BridgeScene
        cameraNode={cameraNode}
        screenDefs={screenDefs}
        objectDefs={objectDefs}
      />

      <BridgeNav current={cameraNode} onChange={handleCameraChange} />

      {/* ── Top-right controls ── */}
      <div style={{
        position: 'absolute', top: '1.25rem', right: '1.25rem',
        zIndex: 100, display: 'flex', gap: '0.5rem', alignItems: 'center',
      }}>
        {DEBUG_OVERLAYS && (
          <button
            onClick={() => {
              phoneArmRef.current?.triggerIncoming('CAPTAIN');
              ringPhone();
            }}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.4)',
              borderRadius: '0.375rem', padding: '0.45rem 0.85rem',
              backdropFilter: 'blur(12px)', color: '#fbbf24',
              fontFamily: '"IBM Plex Mono", "Courier New", monospace',
              fontSize: '0.6rem', letterSpacing: '0.2em', cursor: 'pointer', outline: 'none',
            }}
          >
            📞 CAPTAIN CALL
          </button>
        )}

        <button
          onClick={() => setAudioEnabled(v => !v)}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            background: audioEnabled ? 'rgba(56,189,248,0.12)' : 'rgba(2,11,24,0.82)',
            border: audioEnabled ? '1px solid rgba(56,189,248,0.4)' : '1px solid rgba(255,255,255,0.1)',
            borderRadius: '0.375rem', padding: '0.45rem 0.85rem',
            backdropFilter: 'blur(12px)', color: audioEnabled ? '#38bdf8' : '#475569',
            fontFamily: '"IBM Plex Mono", "Courier New", monospace', fontSize: '0.6rem',
            letterSpacing: '0.2em', cursor: 'pointer', transition: 'all 0.2s ease',
            boxShadow: audioEnabled ? '0 0 16px rgba(56,189,248,0.2)' : 'none', outline: 'none',
          }}
        >
          <span style={{ fontSize: '0.85rem' }}>{audioEnabled ? '🔊' : '🔇'}</span>
          {audioEnabled ? 'AMBIENCE ON' : 'AMBIENCE OFF'}
        </button>
      </div>

      {/* ── Arms ── */}
      <div style={{ position: 'fixed', inset: '-20px', zIndex: 90, pointerEvents: 'none', overflow: 'visible', ...armSway }}>
        <RadioArm
          imagePath="/shipimages/"
          pttPos={{ bottom: '20%', right: '68%', width: '28%', height: '25%' }}
          debugBorder={DEBUG_OVERLAYS}
          onPTTChange={reportPTT}
        />
        <PhoneArm
          imagePath="/shipimages/"
          debugBorders={DEBUG_OVERLAYS}
          handleRef={phoneArmRef}
          onPickUp={stopRing}
          onPhoneRaised={reportPhoneRaised}
          onPhoneDialled={reportPhoneDialled}
          onPhoneOutgoing={reportPhoneOutgoing}
          onPhoneAnswered={reportPhoneAnswered}
          onPhoneEnded={reportPhoneEnded}
          onPhoneMissed={reportPhoneMissed}
          onPhoneIncoming={reportPhoneIncoming}
          screenPos={{ top: '60%',  left: '37%', width: '30%', rotate: '0deg', rotateX: '0deg', rotateY: '0deg' }}
          keypadPos={{ top: '78%',  left: '35%', width: '36%', height: '10.5%', rotate: '-1deg', rotateX: '0deg', rotateY: '0deg' }}
          answerPos={{ bottom: '22%', left: '33%', width: '15%', height: '3%', rotate: '-1deg' }}
          endPos={{    bottom: '22.3%', left: '57%', width: '15%', height: '3%', rotate: '-1deg' }}
        />
      </div>
    </div>
  );
}