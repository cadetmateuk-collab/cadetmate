'use client';

import { useEffect, useState, type Ref } from 'react';
import { MarkSvg } from '@/svg/buoyage/MarkSvg';
import type { BuoyDefinition, LightColour, SvgMarkKey } from '@/types/buoyage';

type Props = {
  def: BuoyDefinition;
  night: boolean;
  className?: string;
  /** Light layer ref for animated lights (SVG path only) */
  lightRef?: Ref<SVGGElement>;
  /** When true, hide SVG light (image may bake light; still can overlay separately) */
  showSvgLight?: boolean;
};

/**
 * Prefers raster day art when present; falls back to procedural SVG on 404.
 * Night = same day image at 10% opacity (caller adds flashing light separately if needed).
 */
export function MarkVisual({
  def,
  night,
  className,
  lightRef,
  showSvgLight = true,
}: Props) {
  const src = def.imageDay;
  const [failed, setFailed] = useState(false);
  const useImage = Boolean(src) && !failed;

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (useImage && src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={def.name}
        className={className ?? 'h-full w-full object-contain'}
        style={{ opacity: night ? 0.1 : 1 }}
        draggable={false}
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <div className={className ?? 'h-full w-full'} style={{ opacity: night ? 0.1 : 1 }}>
      <MarkSvg
        markKey={(night ? def.svgNight : def.svgDay) as SvgMarkKey}
        bodyColours={def.bodyColours}
        lightColour={(showSvgLight ? def.lightColour : 'none') as LightColour}
        night={night}
        lightRef={lightRef}
        className="h-full w-full"
      />
    </div>
  );
}
