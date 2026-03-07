'use client';

import { useState } from 'react';
import type { CameraNode } from './BridgeScene';

// ── Node metadata ─────────────────────────────────────────────────────────────

interface NodeMeta {
  label:    string;
  abbrev:   string;
  side:     'port' | 'centre' | 'starboard';
  group:    'aft' | 'bridge' | 'wing';
  desc:     string;
}

const NODE_META: Record<CameraNode, NodeMeta> = {
  psWing:     { label: 'PS Wing',      abbrev: 'WING',     side: 'port',      group: 'wing',   desc: 'Port side external wing' },
  psLookout:  { label: 'PS Lookout',   abbrev: 'LOOKOUT',  side: 'port',      group: 'bridge', desc: 'Port side lookout position' },
  psRadio:    { label: 'PS Radio',     abbrev: 'GMDSS',    side: 'port',      group: 'bridge', desc: 'Radio & communications' },
  psEcdis:    { label: 'PS ECDIS',     abbrev: 'ECDIS',    side: 'port',      group: 'bridge', desc: 'Electronic chart display' },
  psSofa:     { label: 'PS Sofa',      abbrev: 'COFFEE',   side: 'centre',    group: 'bridge', desc: 'Port side seating area' },
  helm:       { label: 'Helm',         abbrev: 'HELM',     side: 'centre',    group: 'bridge', desc: 'Primary helm station' },
  back:       { label: 'Aft Bridge',   abbrev: 'OVERVIEW', side: 'centre',    group: 'aft',    desc: 'Aft bridge overview' },
  sbDesk:     { label: 'SB Desk',      abbrev: 'DESK',     side: 'centre',    group: 'bridge', desc: 'Starboard navigation desk' },
  radar:      { label: 'SB Radar',     abbrev: 'RADAR',    side: 'starboard', group: 'bridge', desc: 'Radar & ARPA station' },
  sbLogbook:  { label: 'SB Logbook',   abbrev: 'LOGBOOK',  side: 'starboard', group: 'bridge', desc: 'Chart table & logbook' },
  sbLookout:  { label: 'SB Lookout',   abbrev: 'LOOKOUT',  side: 'starboard', group: 'bridge', desc: 'Starboard lookout position' },
  sbWing:     { label: 'SB Wing',      abbrev: 'WING',     side: 'starboard', group: 'wing',   desc: 'Starboard external wing' },
};

// Layout order: port-wing | port-bridge | centre | starboard-bridge | starboard-wing
const LAYOUT_ROWS: { label: string; nodes: CameraNode[] }[] = [
  {
    label: 'Wings',
    nodes: ['psWing', 'psLookout', 'helm', 'sbLookout', 'sbWing'],
  },
  {
    label: 'Bridge',
    nodes: ['psRadio', 'psEcdis', 'back', 'sbDesk', 'sbLogbook'],
  },
  {
    label: 'Aft / Stations',
    nodes: ['psSofa', 'psLookout', 'helm', 'radar', 'sbWing'],
  },
];

// port → centre → starboard, left to right
const ORDERED_NODES: CameraNode[] = [
  'psWing', 'psLookout', 'psRadio', 'psEcdis',
  'psSofa', 'helm', 'back', 'sbDesk',
  'radar', 'sbLogbook', 'sbLookout', 'sbWing',
];

const SIDE_COLOR: Record<string, string> = {
  port:      '#38bdf8',   // sky blue
  centre:    '#fbbf24',   // amber
  starboard: '#34d399',   // emerald
};

const SIDE_GLOW: Record<string, string> = {
  port:      'rgba(56,189,248,0.35)',
  centre:    'rgba(251,191,36,0.35)',
  starboard: 'rgba(52,211,153,0.35)',
};

// ── Component ─────────────────────────────────────────────────────────────────

interface BridgeNavProps {
  current:   CameraNode;
  onChange:  (node: CameraNode) => void;
}

export function BridgeNav({ current, onChange }: BridgeNavProps) {
  const [hovered, setHovered] = useState<CameraNode | null>(null);
  const [expanded, setExpanded] = useState(false);

  const meta      = NODE_META[current];
  const hovMeta   = hovered ? NODE_META[hovered] : null;
  const showMeta  = hovMeta ?? meta;

  return (
    <>
      {/* ── Floating status badge (top-left) ── */}
      <div style={{
        position:       'absolute',
        top:            '1.25rem',
        left:           '1.25rem',
        zIndex:         100,
        display:        'flex',
        alignItems:     'center',
        gap:            '0.6rem',
        background:     'rgba(2,11,24,0.82)',
        border:         `1px solid ${SIDE_COLOR[meta.side]}44`,
        borderRadius:   '0.375rem',
        padding:        '0.45rem 0.85rem',
        backdropFilter: 'blur(12px)',
        fontFamily:     '"IBM Plex Mono", "Courier New", monospace',
        pointerEvents:  'none',
        boxShadow:      `0 0 20px ${SIDE_GLOW[meta.side]}, 0 2px 8px rgba(0,0,0,0.5)`,
        transition:     'box-shadow 0.3s ease',
      }}>
        <span style={{
          fontSize:      '0.55rem',
          letterSpacing: '0.25em',
          color:         SIDE_COLOR[meta.side],
          opacity:       0.7,
          textTransform: 'uppercase',
        }}>POSITION</span>
        <span style={{
          fontSize:      '0.75rem',
          letterSpacing: '0.15em',
          color:         '#e2e8f0',
          fontWeight:    600,
        }}>{meta.label.toUpperCase()}</span>
        <span style={{
          fontSize:      '0.55rem',
          color:         SIDE_COLOR[meta.side],
          opacity:       0.55,
          marginLeft:    '0.25rem',
        }}>◈</span>
      </div>

      {/* ── Bottom nav strip ── */}
      <div style={{
        position:       'absolute',
        bottom:         0,
        left:           0,
        right:          0,
        zIndex:         100,
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
      }}>

        {/* ── Tooltip bar ── */}
        <div style={{
          display:        'flex',
          alignItems:     'center',
          gap:            '0.6rem',
          marginBottom:   '0.4rem',
          background:     'rgba(2,11,24,0.7)',
          border:         '1px solid rgba(255,255,255,0.07)',
          borderRadius:   '0.3rem',
          padding:        '0.3rem 0.9rem',
          backdropFilter: 'blur(10px)',
          fontFamily:     '"IBM Plex Mono", "Courier New", monospace',
          fontSize:       '0.6rem',
          letterSpacing:  '0.18em',
          color:          SIDE_COLOR[showMeta.side],
          pointerEvents:  'none',
          opacity:        hovered || true ? 1 : 0,
          transition:     'opacity 0.2s',
          minWidth:       '200px',
          justifyContent: 'center',
        }}>
          <span style={{ color: '#94a3b8', fontSize: '0.55rem' }}>
            {showMeta.abbrev}
          </span>
          <span style={{ color: 'rgba(255,255,255,0.2)' }}>│</span>
          <span>{showMeta.desc.toUpperCase()}</span>
        </div>

        {/* ── Node strip ── */}
        <div style={{
          display:        'flex',
          alignItems:     'stretch',
          gap:            '2px',
          background:     'rgba(2,11,24,0.88)',
          borderTop:      '1px solid rgba(255,255,255,0.08)',
          padding:        '0.5rem 0.75rem',
          backdropFilter: 'blur(16px)',
          width:          '100%',
          justifyContent: 'center',
          boxSizing:      'border-box',
        }}>
          {/* Port side label */}
          <SideLabel color={SIDE_COLOR.port} side="PORT" align="left" />

          <div style={{ display: 'flex', gap: '3px', alignItems: 'stretch' }}>
            {ORDERED_NODES.map((node, i) => {
              const nm      = NODE_META[node];
              const isActive = node === current;
              const isHov   = node === hovered;
              const color   = SIDE_COLOR[nm.side];

              // Dividers wrap the entire centre block
              const showDividerBefore = node === 'psSofa';
              const showDividerAfter  = node === 'sbDesk';

              return (
                <div key={node} style={{ display: 'flex', alignItems: 'stretch', gap: '3px' }}>
                  {showDividerBefore && <Divider />}
                  <button
                    onClick={() => onChange(node)}
                    onMouseEnter={() => setHovered(node)}
                    onMouseLeave={() => setHovered(null)}
                    style={{
                      position:      'relative',
                      display:       'flex',
                      flexDirection: 'column',
                      alignItems:    'center',
                      justifyContent:'center',
                      gap:           '3px',
                      width:         '62px',
                      padding:       '0.45rem 0.25rem',
                      background:    isActive
                        ? `${color}18`
                        : isHov ? `${color}0d` : 'transparent',
                      border:        isActive
                        ? `1px solid ${color}66`
                        : isHov ? `1px solid ${color}33` : '1px solid transparent',
                      borderRadius:  '0.25rem',
                      cursor:        'pointer',
                      transition:    'all 0.18s ease',
                      boxShadow:     isActive ? `0 0 12px ${SIDE_GLOW[nm.side]}` : 'none',
                      outline:       'none',
                    }}
                  >
                    {/* Active indicator pip */}
                    {isActive && (
                      <div style={{
                        position:   'absolute',
                        top:        '3px',
                        left:       '50%',
                        transform:  'translateX(-50%)',
                        width:      '4px',
                        height:     '4px',
                        borderRadius:'50%',
                        background: color,
                        boxShadow:  `0 0 6px ${color}`,
                      }} />
                    )}

                    {/* Abbreviation */}
                    <span style={{
                      fontFamily:    '"IBM Plex Mono", "Courier New", monospace',
                      fontSize:      '0.6rem',
                      fontWeight:    700,
                      letterSpacing: '0.12em',
                      color:         isActive ? color : isHov ? `${color}cc` : '#475569',
                      transition:    'color 0.18s ease',
                      marginTop:     '4px',
                    }}>
                      {nm.abbrev}
                    </span>

                    {/* Label */}
                    <span style={{
                      fontFamily:    '"IBM Plex Mono", "Courier New", monospace',
                      fontSize:      '0.42rem',
                      letterSpacing: '0.08em',
                      color:         isActive ? '#94a3b8' : isHov ? '#64748b' : '#334155',
                      whiteSpace:    'nowrap',
                      overflow:      'hidden',
                      textOverflow:  'ellipsis',
                      maxWidth:      '58px',
                      textAlign:     'center',
                    }}>
                      {nm.label.toUpperCase()}
                    </span>
                  </button>
                  {showDividerAfter && <Divider />}
                </div>
              );
            })}
          </div>

          {/* Starboard side label */}
          <SideLabel color={SIDE_COLOR.starboard} side="STBD" align="right" />
        </div>
      </div>
    </>
  );
}

function SideLabel({ color, side, align }: { color: string; side: string; align: 'left' | 'right' }) {
  return (
    <div style={{
      display:        'flex',
      alignItems:     'center',
      padding:        '0 0.5rem',
      fontFamily:     '"IBM Plex Mono", "Courier New", monospace',
      fontSize:       '0.5rem',
      letterSpacing:  '0.25em',
      color:          color,
      opacity:        0.5,
      writingMode:    'horizontal-tb',
      userSelect:     'none',
      minWidth:       '36px',
      justifyContent: align === 'left' ? 'flex-end' : 'flex-start',
    }}>
      {side}
    </div>
  );
}

function Divider() {
  return (
    <div style={{
      width:      '1px',
      background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.12), transparent)',
      margin:     '0 2px',
      alignSelf:  'stretch',
    }} />
  );
}