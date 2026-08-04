'use client';

import { memo, useEffect, useRef, useState } from 'react';
import { getDefinition } from '@/data/buoyage';
import { parseCharacteristic } from '@/data/buoyage/light-patterns';
import { registerLight, unregisterLight } from '@/lib/buoyage/light-engine';
import { MarkSvg } from '@/svg/buoyage/MarkSvg';
import type { CanvasMark } from '@/types/buoyage';
import { useBuoyageStore } from '@/hooks/buoyage/useBuoyageStore';

type Props = {
  mark: CanvasMark;
  selected: boolean;
  onPointerDown: (e: React.PointerEvent, id: string) => void;
};

const BASE_W = 80;

function BuoyMarkRendererInner({ mark, selected, onPointerDown }: Props) {
  const def = getDefinition(mark.definitionId);
  const globalNight = useBuoyageStore((s) => s.nightMode);
  const camera = useBuoyageStore((s) => s.camera);
  const lightRef = useRef<SVGGElement>(null);
  const [imgFailed, setImgFailed] = useState(false);

  const night =
    mark.nightMode === true || mark.nightMode === false
      ? mark.nightMode
      : globalNight;

  const imageSrc = def?.imageDay;
  const useImage = Boolean(imageSrc) && !imgFailed;

  useEffect(() => {
    setImgFailed(false);
  }, [imageSrc]);

  useEffect(() => {
    if (!def || def.lightColour === 'none') {
      unregisterLight(mark.id);
      return;
    }
    // Animated light only when using SVG (or as overlay on image)
    const sequence = mark.lightCharacteristicOverride
      ? parseCharacteristic(mark.lightCharacteristicOverride, def.periodSec)
      : def.flashSequence;
    const el = lightRef.current;
    registerLight(
      mark.id,
      el as (Element & { style: CSSStyleDeclaration }) | null,
      sequence,
      def.lightColour,
    );
    return () => unregisterLight(mark.id);
  }, [mark.id, mark.lightCharacteristicOverride, def, night, useImage]);

  if (!def) return null;

  const screenX = mark.x * camera.zoom + camera.x;
  const screenY = mark.y * camera.zoom + camera.y;
  const displaySize = BASE_W * mark.scale * camera.zoom;

  return (
    <div
      className="absolute origin-center select-none"
      style={{
        left: screenX,
        top: screenY,
        width: displaySize,
        height: displaySize * (86 / 80),
        transform: `translate(-50%, -50%) rotate(${mark.rotation}deg)`,
        zIndex: mark.zIndex + (selected ? 10000 : 0),
        cursor: 'grab',
        touchAction: 'none',
      }}
      onPointerDown={(e) => onPointerDown(e, mark.id)}
      data-mark-id={mark.id}
    >
      {selected && (
        <div className="pointer-events-none absolute -inset-[10%] rounded-xl border-2 border-[#2A61FA] shadow-[0_0_0_1px_rgba(42,97,250,0.25)]" />
      )}
      {useImage && imageSrc ? (
        <div className="relative h-full w-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageSrc}
            alt={def.name}
            className="h-full w-full object-contain"
            style={{ opacity: night ? 0.1 : 1 }}
            draggable={false}
            onError={() => setImgFailed(true)}
          />
          {/* Flashing light — always available; visible at night */}
          {def.lightColour !== 'none' && (
            <svg
              className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
              viewBox="0 0 80 86"
              aria-hidden
            >
              <g ref={lightRef} style={{ opacity: 0 }}>
                <circle
                  cx={40}
                  cy={22}
                  r={6}
                  fill={
                    def.lightColour === 'red'
                      ? '#FF4D4D'
                      : def.lightColour === 'green'
                        ? '#3DFF8A'
                        : def.lightColour === 'yellow'
                          ? '#FFE066'
                          : def.lightColour === 'blue'
                            ? '#66B3FF'
                            : '#FFFFFF'
                  }
                />
                <circle
                  cx={40}
                  cy={22}
                  r={11}
                  fill={
                    def.lightColour === 'red'
                      ? '#FF4D4D'
                      : def.lightColour === 'green'
                        ? '#3DFF8A'
                        : def.lightColour === 'yellow'
                          ? '#FFE066'
                          : def.lightColour === 'blue'
                            ? '#66B3FF'
                            : '#FFFFFF'
                  }
                  opacity={0.3}
                />
              </g>
            </svg>
          )}
        </div>
      ) : (
        <div className="relative h-full w-full">
          <div className="h-full w-full" style={{ opacity: night ? 0.1 : 1 }}>
            <MarkSvg
              markKey={night ? def.svgNight : def.svgDay}
              bodyColours={def.bodyColours}
              lightColour={night ? 'none' : def.lightColour}
              night={night}
              lightRef={night ? undefined : lightRef}
              className="h-full w-full"
            />
          </div>
          {night && def.lightColour !== 'none' && (
            <svg
              className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
              viewBox="0 0 80 86"
              aria-hidden
            >
              <g ref={lightRef} style={{ opacity: 0 }}>
                <circle
                  cx={40}
                  cy={22}
                  r={6}
                  fill={
                    def.lightColour === 'red'
                      ? '#FF4D4D'
                      : def.lightColour === 'green'
                        ? '#3DFF8A'
                        : def.lightColour === 'yellow'
                          ? '#FFE066'
                          : def.lightColour === 'blue'
                            ? '#66B3FF'
                            : '#FFFFFF'
                  }
                />
                <circle
                  cx={40}
                  cy={22}
                  r={11}
                  fill={
                    def.lightColour === 'red'
                      ? '#FF4D4D'
                      : def.lightColour === 'green'
                        ? '#3DFF8A'
                        : def.lightColour === 'yellow'
                          ? '#FFE066'
                          : def.lightColour === 'blue'
                            ? '#66B3FF'
                            : '#FFFFFF'
                  }
                  opacity={0.3}
                />
              </g>
            </svg>
          )}
        </div>
      )}
      {mark.label && (
        <div
          className="pointer-events-none absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap rounded bg-black/70 px-1.5 py-0.5 font-medium text-white"
          style={{
            fontSize: Math.max(9, 10 * camera.zoom),
            transform: `translate(-50%, 0) rotate(${-mark.rotation}deg)`,
          }}
        >
          {mark.label}
        </div>
      )}
    </div>
  );
}

export const BuoyMarkRenderer = memo(BuoyMarkRendererInner);
