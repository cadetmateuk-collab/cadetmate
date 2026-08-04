'use client';

import { useId } from 'react';
import type { LightColour, SvgMarkKey } from '@/types/buoyage';

const LIGHT_HEX: Record<LightColour, string> = {
  red: '#FF3B3B',
  green: '#2EE66A',
  white: '#FFFFFF',
  yellow: '#FFD93B',
  blue: '#4DA3FF',
  none: 'transparent',
};

type MarkSvgProps = {
  markKey: SvgMarkKey;
  bodyColours: string[];
  lightColour: LightColour;
  night: boolean;
  lightRef?: React.Ref<SVGGElement>;
  className?: string;
};

function Cone({
  cx,
  cy,
  colour,
  pointUp = true,
  size = 14,
}: {
  cx: number;
  cy: number;
  colour: string;
  pointUp?: boolean;
  size?: number;
}) {
  const h = size;
  const w = size * 0.7;
  const points = pointUp
    ? `${cx},${cy - h / 2} ${cx - w / 2},${cy + h / 2} ${cx + w / 2},${cy + h / 2}`
    : `${cx},${cy + h / 2} ${cx - w / 2},${cy - h / 2} ${cx + w / 2},${cy - h / 2}`;
  return <polygon points={points} fill={colour} stroke="#111" strokeWidth={1} />;
}

function Sphere({ cx, cy, r, colour }: { cx: number; cy: number; r: number; colour: string }) {
  return <circle cx={cx} cy={cy} r={r} fill={colour} stroke="#111" strokeWidth={1} />;
}

function Can({
  x,
  y,
  w,
  h,
  colour,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  colour: string;
}) {
  return (
    <rect x={x} y={y} width={w} height={h} rx={2} fill={colour} stroke="#111" strokeWidth={1} />
  );
}

function BuoyBodyPillar({
  colours,
  night,
}: {
  colours: string[];
  night: boolean;
}) {
  const c0 = colours[0] ?? '#888';
  const c1 = colours[1];
  if (night) {
    return (
      <g opacity={0.85}>
        <ellipse cx={40} cy={78} rx={18} ry={5} fill="rgba(0,0,0,0.35)" />
        <rect x={28} y={40} width={24} height={36} rx={3} fill={c0} opacity={0.35} />
        {c1 && <rect x={28} y={52} width={24} height={12} fill={c1} opacity={0.35} />}
      </g>
    );
  }
  return (
    <g>
      <ellipse cx={40} cy={78} rx={18} ry={5} fill="rgba(0,0,0,0.2)" />
      {c1 ? (
        <>
          <rect x={28} y={40} width={24} height={18} rx={2} fill={c0} stroke="#111" strokeWidth={1} />
          <rect x={28} y={58} width={24} height={18} rx={2} fill={c1} stroke="#111" strokeWidth={1} />
        </>
      ) : (
        <rect x={28} y={40} width={24} height={36} rx={3} fill={c0} stroke="#111" strokeWidth={1} />
      )}
    </g>
  );
}

function LightLayer({
  colour,
  lightRef,
}: {
  colour: LightColour;
  lightRef?: React.Ref<SVGGElement>;
}) {
  if (colour === 'none') return null;
  const hex = LIGHT_HEX[colour];
  return (
    <g ref={lightRef} className="buoy-light-layer" style={{ opacity: 0 }}>
      <circle cx={40} cy={28} r={7} fill={hex} />
      <circle cx={40} cy={28} r={12} fill={hex} opacity={0.25} />
    </g>
  );
}

function LateralPort({ bodyColours, night, lightColour, lightRef }: Omit<MarkSvgProps, 'markKey' | 'className'>) {
  const colour = bodyColours[0] ?? '#E53935';
  return (
    <g>
      {!night && (
        <>
          <ellipse cx={40} cy={78} rx={20} ry={5} fill="rgba(0,0,0,0.18)" />
          <Can x={26} y={38} w={28} h={38} colour={colour} />
          <Can x={30} y={18} w={20} h={16} colour={colour} />
        </>
      )}
      {night && (
        <g opacity={0.4}>
          <Can x={26} y={38} w={28} h={38} colour={colour} />
        </g>
      )}
      <LightLayer colour={lightColour} lightRef={lightRef} />
    </g>
  );
}

function LateralStarboard({ bodyColours, night, lightColour, lightRef }: Omit<MarkSvgProps, 'markKey' | 'className'>) {
  const colour = bodyColours[0] ?? '#2E7D32';
  return (
    <g>
      {!night && (
        <>
          <ellipse cx={40} cy={78} rx={20} ry={5} fill="rgba(0,0,0,0.18)" />
          <polygon
            points="40,16 58,76 22,76"
            fill={colour}
            stroke="#111"
            strokeWidth={1}
          />
        </>
      )}
      {night && (
        <polygon points="40,16 58,76 22,76" fill={colour} opacity={0.35} />
      )}
      <LightLayer colour={lightColour} lightRef={lightRef} />
    </g>
  );
}

function CardinalNorth({ bodyColours, night, lightColour, lightRef }: Omit<MarkSvgProps, 'markKey' | 'className'>) {
  return (
    <g>
      <BuoyBodyPillar colours={[bodyColours[0] ?? '#000', bodyColours[1] ?? '#F5C518']} night={night} />
      {!night && (
        <g>
          <Cone cx={40} cy={14} colour="#111" pointUp size={12} />
          <Cone cx={40} cy={28} colour="#111" pointUp size={12} />
        </g>
      )}
      <LightLayer colour={lightColour} lightRef={lightRef} />
    </g>
  );
}

function CardinalEast({ bodyColours, night, lightColour, lightRef }: Omit<MarkSvgProps, 'markKey' | 'className'>) {
  return (
    <g>
      <BuoyBodyPillar colours={[bodyColours[0] ?? '#000', bodyColours[1] ?? '#F5C518']} night={night} />
      {!night && (
        <g>
          <Cone cx={40} cy={14} colour="#111" pointUp size={12} />
          <Cone cx={40} cy={28} colour="#111" pointUp={false} size={12} />
        </g>
      )}
      <LightLayer colour={lightColour} lightRef={lightRef} />
    </g>
  );
}

function CardinalSouth({ bodyColours, night, lightColour, lightRef }: Omit<MarkSvgProps, 'markKey' | 'className'>) {
  return (
    <g>
      <BuoyBodyPillar colours={[bodyColours[0] ?? '#F5C518', bodyColours[1] ?? '#000']} night={night} />
      {!night && (
        <g>
          <Cone cx={40} cy={14} colour="#111" pointUp={false} size={12} />
          <Cone cx={40} cy={28} colour="#111" pointUp={false} size={12} />
        </g>
      )}
      <LightLayer colour={lightColour} lightRef={lightRef} />
    </g>
  );
}

function CardinalWest({ bodyColours, night, lightColour, lightRef }: Omit<MarkSvgProps, 'markKey' | 'className'>) {
  return (
    <g>
      <BuoyBodyPillar colours={[bodyColours[0] ?? '#F5C518', bodyColours[1] ?? '#000']} night={night} />
      {!night && (
        <g>
          <Cone cx={40} cy={14} colour="#111" pointUp={false} size={12} />
          <Cone cx={40} cy={28} colour="#111" pointUp size={12} />
        </g>
      )}
      <LightLayer colour={lightColour} lightRef={lightRef} />
    </g>
  );
}

function IsolatedDangerMark({ bodyColours, night, lightColour, lightRef }: Omit<MarkSvgProps, 'markKey' | 'className'>) {
  return (
    <g>
      <BuoyBodyPillar colours={[bodyColours[0] ?? '#000', bodyColours[1] ?? '#E53935']} night={night} />
      {!night && (
        <g>
          <Sphere cx={40} cy={14} r={7} colour="#111" />
          <Sphere cx={40} cy={28} r={7} colour="#111" />
        </g>
      )}
      <LightLayer colour={lightColour} lightRef={lightRef} />
    </g>
  );
}

function SafeWaterMark({
  bodyColours,
  night,
  lightColour,
  lightRef,
  uid,
}: Omit<MarkSvgProps, 'markKey' | 'className'> & { uid: string }) {
  const red = bodyColours[0] ?? '#E53935';
  const white = bodyColours[1] ?? '#FFFFFF';
  const patternId = `sw-stripes-${uid}`;
  return (
    <g>
      {!night ? (
        <>
          <ellipse cx={40} cy={78} rx={18} ry={5} fill="rgba(0,0,0,0.18)" />
          <defs>
            <pattern id={patternId} width="8" height="40" patternUnits="userSpaceOnUse">
              <rect width="4" height="40" fill={red} />
              <rect x="4" width="4" height="40" fill={white} />
            </pattern>
          </defs>
          <rect x={28} y={40} width={24} height={36} rx={12} fill={`url(#${patternId})`} stroke="#111" strokeWidth={1} />
          <Sphere cx={40} cy={22} r={8} colour={red} />
        </>
      ) : (
        <rect x={28} y={40} width={24} height={36} rx={12} fill={red} opacity={0.3} />
      )}
      <LightLayer colour={lightColour} lightRef={lightRef} />
    </g>
  );
}

function SpecialMarkSvg({ bodyColours, night, lightColour, lightRef }: Omit<MarkSvgProps, 'markKey' | 'className'>) {
  const yellow = bodyColours[0] ?? '#F5C518';
  return (
    <g>
      <BuoyBodyPillar colours={[yellow]} night={night} />
      {!night && (
        <g stroke="#111" strokeWidth={3} strokeLinecap="round">
          <line x1={32} y1={12} x2={48} y2={28} />
          <line x1={48} y1={12} x2={32} y2={28} />
        </g>
      )}
      <LightLayer colour={lightColour} lightRef={lightRef} />
    </g>
  );
}

function EmergencyWreckMark({
  bodyColours,
  night,
  lightColour,
  lightRef,
  uid,
}: Omit<MarkSvgProps, 'markKey' | 'className'> & { uid: string }) {
  const blue = bodyColours[0] ?? '#1E88E5';
  const yellow = bodyColours[1] ?? '#F5C518';
  const patternId = `ew-stripes-${uid}`;
  return (
    <g>
      {!night ? (
        <>
          <ellipse cx={40} cy={78} rx={18} ry={5} fill="rgba(0,0,0,0.18)" />
          <defs>
            <pattern id={patternId} width="8" height="40" patternUnits="userSpaceOnUse">
              <rect width="4" height="40" fill={blue} />
              <rect x="4" width="4" height="40" fill={yellow} />
            </pattern>
          </defs>
          <rect x={28} y={40} width={24} height={36} rx={3} fill={`url(#${patternId})`} stroke="#111" strokeWidth={1} />
          <g stroke={yellow} strokeWidth={3} strokeLinecap="round">
            <line x1={32} y1={12} x2={48} y2={28} />
            <line x1={48} y1={12} x2={32} y2={28} />
          </g>
        </>
      ) : (
        <rect x={28} y={40} width={24} height={36} rx={3} fill={blue} opacity={0.35} />
      )}
      <LightLayer colour={lightColour === 'blue' ? 'blue' : lightColour} lightRef={lightRef} />
    </g>
  );
}

export function MarkSvg({
  markKey,
  bodyColours,
  lightColour,
  night,
  lightRef,
  className,
  size,
}: MarkSvgProps & { size?: number }) {
  const uid = useId().replace(/:/g, '');
  const props = { bodyColours, night, lightColour, lightRef };
  const w = size ?? undefined;
  const h = size != null ? size * (86 / 80) : undefined;
  return (
    <svg
      viewBox="0 0 80 86"
      width={w}
      height={h}
      className={className ?? (size == null ? 'h-[86px] w-20' : undefined)}
      overflow="visible"
      shapeRendering="geometricPrecision"
      aria-hidden
    >
      {markKey === 'lateral-port' && <LateralPort {...props} />}
      {markKey === 'lateral-starboard' && <LateralStarboard {...props} />}
      {markKey === 'cardinal-north' && <CardinalNorth {...props} />}
      {markKey === 'cardinal-east' && <CardinalEast {...props} />}
      {markKey === 'cardinal-south' && <CardinalSouth {...props} />}
      {markKey === 'cardinal-west' && <CardinalWest {...props} />}
      {markKey === 'isolated-danger' && <IsolatedDangerMark {...props} />}
      {markKey === 'safe-water' && <SafeWaterMark {...props} uid={uid} />}
      {markKey === 'special' && <SpecialMarkSvg {...props} />}
      {markKey === 'emergency-wreck' && <EmergencyWreckMark {...props} uid={uid} />}
    </svg>
  );
}

export function MarkThumbnail({
  markKey,
  bodyColours,
  lightColour,
}: {
  markKey: SvgMarkKey;
  bodyColours: string[];
  lightColour: LightColour;
}) {
  return (
    <MarkSvg
      markKey={markKey}
      bodyColours={bodyColours}
      lightColour={lightColour}
      night={false}
      className="h-10 w-10"
    />
  );
}
